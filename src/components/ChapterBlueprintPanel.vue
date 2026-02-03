<script setup>
import { ref, computed } from 'vue'
import { useNovelStore } from '../stores/novel'
import { NButton, NInput, NTag, NIcon, NRadioGroup, NRadioButton } from 'naive-ui'
import { WarningOutline, ListOutline, PlayOutline, RefreshOutline, GridOutline, DocumentTextOutline, SearchOutline, GitNetworkOutline } from '@vicons/ionicons5'

const props = defineProps({
  project: Object,
  chapters: Array,
  isGenerating: Boolean,
  architectureGenerated: Boolean
})

const emit = defineEmits(['generate', 'regenerate'])
const novelStore = useNovelStore()

// View mode - 视图模式
const viewMode = ref('list') // 'list' | 'raw'

// Search query - 搜索查询
const searchQuery = ref('')

// Filtered chapters - 过滤后的章节
const filteredChapters = computed(() => {
  if (!searchQuery.value) return props.chapters
  const query = searchQuery.value.toLowerCase()
  return props.chapters.filter(ch => 
    ch.title.toLowerCase().includes(query) ||
    ch.summary.toLowerCase().includes(query)
  )
})

// Get twist level stars - 获取颠覆等级星星
function getTwistStars(level) {
  if (!level) return '☆☆☆☆☆'
  const starCount = (level.match(/★/g) || []).length
  return level
}

// Update raw blueprint - 更新原始大纲
function updateBlueprint(value) {
  novelStore.updateProject(props.project.id, { chapterBlueprint: value })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Not ready state - 未就绪状态 -->
    <div 
      v-if="!architectureGenerated" 
      class="bg-white dark:bg-[#1f1f23] rounded-2xl p-12 border border-gray-200/80 dark:border-gray-700/50 text-center"
    >
      <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/25">
        <WarningOutline class="w-12 h-12 text-white" />
      </div>
      <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-3">
        请先生成小说架构
      </h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        章节大纲的生成需要基于小说架构（核心种子、角色体系、世界观、情节架构）
      </p>
    </div>

    <!-- Generate button area - 生成按钮区域 -->
    <div 
      v-else-if="!project.chapterBlueprint" 
      class="bg-white dark:bg-[#1f1f23] rounded-2xl p-12 border border-gray-200/80 dark:border-gray-700/50 text-center"
    >
      <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl shadow-purple-500/25">
        <ListOutline class="w-12 h-12 text-white" />
      </div>
      <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-3">
        生成章节大纲
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
        AI 将基于小说架构，生成 {{ project.numberOfChapters }} 章的详细大纲，包含悬念节奏曲线
      </p>
      <n-button 
        type="primary" 
        size="large"
        :loading="isGenerating"
        @click="emit('generate')"
        class="!px-8 !h-12"
      >
        <template #icon v-if="!isGenerating">
          <n-icon><PlayOutline /></n-icon>
        </template>
        {{ isGenerating ? '生成中...' : '开始生成大纲' }}
      </n-button>
    </div>

    <!-- Content area - 内容区域 -->
    <template v-else>
      <!-- Toolbar - 工具栏 -->
      <div class="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-[#1f1f23] rounded-xl p-4 border border-gray-200/80 dark:border-gray-700/50">
        <div class="flex items-center gap-3">
          <!-- View mode toggle - 视图模式切换 -->
          <n-radio-group v-model:value="viewMode" size="small">
            <n-radio-button value="list">
              <div class="flex items-center gap-1">
                <GridOutline class="w-4 h-4" />
                卡片视图
              </div>
            </n-radio-button>
            <n-radio-button value="raw">
              <div class="flex items-center gap-1">
                <DocumentTextOutline class="w-4 h-4" />
                原始文本
              </div>
            </n-radio-button>
          </n-radio-group>

          <!-- Chapter count - 章节数量 -->
          <n-tag type="info" :bordered="false" round>
            共 {{ chapters.length }} 章
          </n-tag>
        </div>

        <div class="flex items-center gap-2">
          <!-- Search - 搜索 -->
          <n-input
            v-if="viewMode === 'list'"
            v-model:value="searchQuery"
            placeholder="搜索章节..."
            clearable
            style="width: 220px"
          >
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>

          <!-- Regenerate - 重新生成 -->
          <n-button 
            :disabled="isGenerating"
            @click="emit('regenerate')"
            secondary
          >
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            重新生成
          </n-button>
        </div>
      </div>

      <!-- List view - 列表视图 -->
      <div v-if="viewMode === 'list'" class="space-y-4">
        <div 
          v-for="chapter in filteredChapters" 
          :key="chapter.number"
          class="bg-white dark:bg-[#1f1f23] rounded-xl p-5 border border-gray-200/80 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
        >
          <div class="flex items-start gap-4">
            <!-- Chapter number - 章节编号 -->
            <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
              <span class="text-white font-bold text-sm">{{ chapter.number }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <!-- Title - 标题 -->
              <h4 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                第{{ chapter.number }}章 - {{ chapter.title }}
              </h4>

              <!-- Meta info - 元信息 -->
              <div class="flex flex-wrap gap-2 mb-3">
                <n-tag v-if="chapter.position" size="small" :bordered="false" round>
                  {{ chapter.position }}
                </n-tag>
                <n-tag v-if="chapter.purpose" size="small" type="success" :bordered="false" round>
                  {{ chapter.purpose }}
                </n-tag>
                <n-tag v-if="chapter.suspense" size="small" type="warning" :bordered="false" round>
                  {{ chapter.suspense }}
                </n-tag>
              </div>

              <!-- Summary - 简述 -->
              <p v-if="chapter.summary" class="text-gray-600 dark:text-gray-300 text-sm mb-3 leading-relaxed">
                {{ chapter.summary }}
              </p>

              <!-- Details - 详情 -->
              <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span v-if="chapter.foreshadowing" class="flex items-center gap-1">
                  <GitNetworkOutline class="w-4 h-4" />
                  {{ chapter.foreshadowing }}
                </span>
                <span v-if="chapter.twistLevel" class="flex items-center gap-1">
                  认知颠覆: {{ getTwistStars(chapter.twistLevel) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty search result - 搜索结果为空 -->
        <div v-if="filteredChapters.length === 0" class="text-center py-16 bg-white dark:bg-[#1f1f23] rounded-xl border border-gray-200/80 dark:border-gray-700/50">
          <SearchOutline class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p class="text-gray-500 dark:text-gray-400">没有找到匹配的章节</p>
        </div>
      </div>

      <!-- Raw view - 原始文本视图 -->
      <div v-else>
        <n-input
          type="textarea"
          :value="project.chapterBlueprint"
          @update:value="updateBlueprint"
          :autosize="{ minRows: 20, maxRows: 50 }"
          class="novel-textarea"
        />
      </div>
    </template>
  </div>
</template>

