<script setup>
import { ref, computed, watch } from 'vue'
import { useMessage, useDialog, NEmpty, NIcon } from 'naive-ui'
import { CompassOutline } from '@vicons/ionicons5'
import { useNovelStore } from '../../stores/novel'
import { useSettingsStore } from '../../stores/settings'
import { generateBaseGraph, generateChapterSnapshots } from '../../api/compass-generator'
import { getSnapshotForChapter, generateExportHTML } from '../../utils/graph-helpers'
import CompassGraph from './CompassGraph.vue'
import CompassToolbar from './CompassToolbar.vue'
import CompassSidebar from './CompassSidebar.vue'
import RelationPopover from './RelationPopover.vue'

const props = defineProps({
  project: Object,
  isGenerating: Boolean
})

const emit = defineEmits(['update:isGenerating'])

const novelStore = useNovelStore()
const settings = useSettingsStore()
const message = useMessage()
const dialog = useDialog()

const graphRef = ref(null)
const localGenerating = ref(false)
const generationStep = ref('')

// Sidebar state
const sidebarVisible = ref(false)
const selectedNode = ref(null)

// Relation popover state
const popoverVisible = ref(false)
const selectedEdge = ref(null)
const popoverPos = ref({ x: 0, y: 0 })

// Current chapter for timeline
const currentChapter = ref(0)

const graphData = computed(() => props.project?.graphData || null)
const graphGenerated = computed(() => graphData.value?.graphGenerated || false)
const hasChapters = computed(() => Object.keys(props.project?.chapters || {}).length > 0)
const maxChapter = computed(() => props.project?.numberOfChapters || 0)

const currentSnapshot = computed(() => {
  if (!graphData.value?.snapshots) return null
  return getSnapshotForChapter(graphData.value.snapshots, currentChapter.value)
})

const allNodes = computed(() => currentSnapshot.value?.nodes || [])
const allEdges = computed(() => currentSnapshot.value?.edges || [])

const isWorking = computed(() => localGenerating.value || props.isGenerating)

// Generate base graph
async function handleGenerate() {
  if (!settings.apiConfig.apiKey) {
    message.warning('请先在设置中配置 API Key')
    return
  }
  if (!props.project.architectureGenerated) {
    message.warning('请先生成小说架构')
    return
  }

  try {
    localGenerating.value = true
    emit('update:isGenerating', true)

    const result = await generateBaseGraph(
      props.project,
      settings.getStageConfig('architecture'),
      (step) => { generationStep.value = step }
    )

    novelStore.updateProject(props.project.id, { graphData: result })
    message.success('图谱生成完成!')
    currentChapter.value = 0
  } catch (err) {
    console.error('Graph generation error:', err)
    message.error('图谱生成失败: ' + err.message)
  } finally {
    localGenerating.value = false
    emit('update:isGenerating', false)
    generationStep.value = ''
  }
}

// Update chapter snapshots
async function handleUpdateSnapshots() {
  if (!settings.apiConfig.apiKey) {
    message.warning('请先在设置中配置 API Key')
    return
  }

  try {
    localGenerating.value = true
    emit('update:isGenerating', true)

    const result = await generateChapterSnapshots(
      props.project,
      settings.getStageConfig('architecture'),
      (step) => { generationStep.value = step }
    )

    novelStore.updateProject(props.project.id, { graphData: result })
    message.success('章节快照更新完成!')
  } catch (err) {
    console.error('Snapshot generation error:', err)
    message.error('快照更新失败: ' + err.message)
  } finally {
    localGenerating.value = false
    emit('update:isGenerating', false)
    generationStep.value = ''
  }
}

// Node click → show sidebar
function handleNodeClick(nodeId) {
  const node = allNodes.value.find(n => n.id === nodeId)
  if (node) {
    selectedNode.value = node
    sidebarVisible.value = true
    popoverVisible.value = false
  }
}

// Edge click → show popover
function handleEdgeClick(edgeId) {
  const edge = allEdges.value.find(e => e.id === edgeId)
  if (edge) {
    selectedEdge.value = edge
    popoverPos.value = { x: window.innerWidth / 2 - 144, y: window.innerHeight / 2 - 100 }
    popoverVisible.value = true
  }
}

// Node double click → focus mode (handled by CompassGraph internally)
function handleNodeDblclick(nodeId) {
  const node = allNodes.value.find(n => n.id === nodeId)
  if (node) {
    selectedNode.value = node
    sidebarVisible.value = true
  }
}

// Canvas double click → exit focus mode
function handleCanvasDblclick() {
  // Focus mode exit handled by CompassGraph
}

// Chapter change from timeline
function handleChapterChange(chapter) {
  currentChapter.value = chapter
  popoverVisible.value = false
}

// Delete node
function handleDeleteNode(nodeId) {
  const node = allNodes.value.find(n => n.id === nodeId)
  if (!node) return

  // Find affected chapters
  const snapshots = graphData.value?.snapshots || {}
  const affectedChapters = []
  for (const [ch, snap] of Object.entries(snapshots)) {
    if (snap.nodes.some(n => n.id === nodeId) || snap.edges.some(e => e.source === nodeId || e.target === nodeId)) {
      affectedChapters.push(ch)
    }
  }

  dialog.warning({
    title: '删除节点确认',
    content: `删除「${node.label}」将影响${affectedChapters.length > 0 ? `第 ${affectedChapters.join('、')} 章` : '当前'}图谱数据。确定删除？`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const updatedSnapshots = { ...snapshots }
      for (const [ch, snap] of Object.entries(updatedSnapshots)) {
        updatedSnapshots[ch] = {
          nodes: snap.nodes.filter(n => n.id !== nodeId),
          edges: snap.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
        }
      }
      const updatedGraphData = { ...graphData.value, snapshots: updatedSnapshots }
      novelStore.updateProject(props.project.id, { graphData: updatedGraphData })
      sidebarVisible.value = false
      selectedNode.value = null
      message.success(`已删除「${node.label}」`)
    }
  })
}

// Export PNG
async function handleExportPNG() {
  if (!graphRef.value) return
  try {
    const dataUrl = await graphRef.value.exportPNG()
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${props.project.title}-关系图谱.png`
    a.click()
    message.success('PNG 导出成功')
  } catch (err) {
    message.error('PNG 导出失败')
  }
}

// Export HTML
function handleExportHTML() {
  const html = generateExportHTML(graphData.value, props.project.title)
  if (!html) {
    message.warning('暂无图谱数据可导出')
    return
  }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.project.title}-关系图谱.html`
  a.click()
  URL.revokeObjectURL(url)
  message.success('HTML 导出成功')
}

// Reset view
function handleResetView() {
  sidebarVisible.value = false
  popoverVisible.value = false
  selectedNode.value = null
  selectedEdge.value = null
}

// Close popover on outside click
function handleGlobalClick() {
  if (popoverVisible.value) popoverVisible.value = false
}
</script>

<template>
  <div class="space-y-4" @click="handleGlobalClick">
    <!-- Toolbar -->
    <CompassToolbar
      :is-generating="isWorking"
      :graph-generated="graphGenerated"
      :has-chapters="hasChapters"
      @generate="handleGenerate"
      @update-snapshots="handleUpdateSnapshots"
      @export-png="handleExportPNG"
      @export-html="handleExportHTML"
      @reset-view="handleResetView"
    />

    <!-- Generation progress -->
    <div
      v-if="isWorking && generationStep"
      class="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm text-indigo-600 dark:text-indigo-400"
    >
      <span class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      {{ generationStep }}
    </div>

    <!-- Main content area -->
    <div v-if="graphGenerated" class="flex rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-700/50" style="height: 600px;">
      <!-- Graph canvas -->
      <div class="flex-1 relative">
        <CompassGraph
          ref="graphRef"
          :snapshot="currentSnapshot"
          :focus-node-id="selectedNode?.id"
          @node-click="handleNodeClick"
          @edge-click="handleEdgeClick"
          @node-dblclick="handleNodeDblclick"
          @canvas-dblclick="handleCanvasDblclick"
        />

        <!-- Focus mode hint -->
        <div
          v-if="selectedNode"
          class="absolute top-3 left-3 text-xs px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-500 dark:text-gray-400"
        >
          双击角色进入聚焦模式 · 双击空白退出
        </div>
      </div>

      <!-- Sidebar / Audit Panel -->
      <CompassSidebar
        :node="selectedNode"
        :edges="allEdges"
        :all-nodes="allNodes"
        :visible="sidebarVisible"
        @close="sidebarVisible = false"
        @delete-node="handleDeleteNode"
        @locate-chapter="handleChapterChange"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1f1f23] rounded-xl border border-gray-200/80 dark:border-gray-700/50">
      <CompassOutline class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <p class="text-gray-500 dark:text-gray-400 mb-2">尚未生成关系图谱</p>
      <p class="text-sm text-gray-400 dark:text-gray-500">
        {{ props.project?.architectureGenerated ? '点击上方「生成图谱」按钮开始' : '请先在「小说架构」中生成架构数据' }}
      </p>
    </div>

    <!-- Relation Popover -->
    <RelationPopover
      :edge="selectedEdge"
      :all-nodes="allNodes"
      :visible="popoverVisible"
      :x="popoverPos.x"
      :y="popoverPos.y"
      @close="popoverVisible = false"
    />
  </div>
</template>
