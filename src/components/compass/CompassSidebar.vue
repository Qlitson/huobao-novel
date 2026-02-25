<script setup>
import { computed } from 'vue'
import { NTag, NEmpty, NButton, NIcon, NScrollbar, NCollapse, NCollapseItem } from 'naive-ui'
import { CloseOutline, TrashOutline, PersonOutline, LocationOutline, ShieldOutline, DiamondOutline } from '@vicons/ionicons5'
import { RELATION_LABELS, RELATION_COLORS, NODE_TYPE_LABELS } from '../../utils/graph-helpers'

const props = defineProps({
  node: Object,
  edges: Array,
  allNodes: Array,
  visible: Boolean
})

const emit = defineEmits(['close', 'delete-node', 'locate-chapter'])

const typeIcons = {
  character: PersonOutline,
  faction: ShieldOutline,
  location: LocationOutline,
  item: DiamondOutline
}

const relatedEdges = computed(() => {
  if (!props.node || !props.edges) return []
  return props.edges.filter(e => e.source === props.node.id || e.target === props.node.id)
})

const relatedChapters = computed(() => {
  if (!props.node) return []
  const chapters = new Set()
  if (props.node.firstAppearance !== undefined) chapters.add(props.node.firstAppearance)
  relatedEdges.value.forEach(e => {
    (e.events || []).forEach(() => chapters.add(props.node.firstAppearance))
  })
  return [...chapters].sort((a, b) => a - b)
})

function getOtherNode(edge) {
  if (!props.node || !props.allNodes) return null
  const otherId = edge.source === props.node.id ? edge.target : edge.source
  return props.allNodes.find(n => n.id === otherId)
}
</script>

<template>
  <transition name="slide-right">
    <div
      v-if="visible && node"
      class="w-80 h-full bg-white dark:bg-[#1f1f23] border-l border-gray-200/80 dark:border-gray-700/50 flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-gray-700/50">
        <div class="flex items-center gap-2">
          <component :is="typeIcons[node.type] || PersonOutline" class="w-5 h-5 text-indigo-500" />
          <span class="font-semibold text-gray-800 dark:text-white">{{ node.label }}</span>
          <n-tag :bordered="false" size="small" round>
            {{ NODE_TYPE_LABELS[node.type] || node.type }}
          </n-tag>
        </div>
        <n-button quaternary circle size="small" @click="emit('close')">
          <template #icon>
            <n-icon><CloseOutline /></n-icon>
          </template>
        </n-button>
      </div>

      <!-- Content -->
      <n-scrollbar class="flex-1">
        <div class="p-4 space-y-4">
          <!-- Status & Importance -->
          <div class="flex items-center gap-2 flex-wrap">
            <n-tag
              :type="node.status === 'active' ? 'success' : node.status === 'deceased' ? 'error' : 'warning'"
              size="small"
              :bordered="false"
              round
            >
              {{ node.status === 'active' ? '活跃' : node.status === 'deceased' ? '已故' : '离场' }}
            </n-tag>
            <n-tag v-if="node.faction" size="small" :bordered="false" round>
              {{ node.faction }}
            </n-tag>
            <span class="text-xs text-gray-400">
              重要度 {{ node.importance }}/10
            </span>
          </div>

          <!-- Bio -->
          <div v-if="node.bio" class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {{ node.bio }}
          </div>

          <!-- Traits -->
          <div v-if="node.traits?.length" class="flex flex-wrap gap-1.5">
            <n-tag v-for="t in node.traits" :key="t" size="tiny" :bordered="false" round>
              {{ t }}
            </n-tag>
          </div>

          <!-- Relations -->
          <n-collapse :default-expanded-names="['relations']">
            <n-collapse-item title="关系网络" name="relations">
              <div v-if="relatedEdges.length === 0" class="text-sm text-gray-400">暂无关系</div>
              <div v-else class="space-y-2">
                <div
                  v-for="edge in relatedEdges"
                  :key="edge.id"
                  class="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="w-2 h-2 rounded-full"
                      :style="{ backgroundColor: RELATION_COLORS[edge.relationType] }"
                    />
                    <span class="font-medium text-gray-700 dark:text-gray-200">
                      {{ getOtherNode(edge)?.label || '未知' }}
                    </span>
                    <n-tag size="tiny" :bordered="false" round>
                      {{ RELATION_LABELS[edge.relationType] || edge.relationType }}
                    </n-tag>
                  </div>
                  <div class="text-gray-500 dark:text-gray-400 text-xs">
                    {{ edge.description || edge.label }}
                  </div>
                </div>
              </div>
            </n-collapse-item>

            <n-collapse-item title="关联章节" name="chapters">
              <div v-if="relatedChapters.length === 0" class="text-sm text-gray-400">暂无关联章节</div>
              <div v-else class="flex flex-wrap gap-1.5">
                <n-button
                  v-for="ch in relatedChapters"
                  :key="ch"
                  size="tiny"
                  secondary
                  @click="emit('locate-chapter', ch)"
                >
                  第 {{ ch }} 章
                </n-button>
              </div>
            </n-collapse-item>
          </n-collapse>

          <!-- Delete -->
          <div class="pt-2 border-t border-gray-200/80 dark:border-gray-700/50">
            <n-button size="small" type="error" quaternary @click="emit('delete-node', node.id)">
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
              删除此节点
            </n-button>
          </div>
        </div>
      </n-scrollbar>
    </div>
  </transition>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
