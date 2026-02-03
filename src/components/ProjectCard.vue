<script setup>
import { computed } from 'vue'
import { NButton, NProgress, NTag, NIcon } from 'naive-ui'
import { TrashOutline } from '@vicons/ionicons5'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'delete'])

// Format date - 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get status info - 获取状态信息
const statusInfo = computed(() => {
  if (props.project.blueprintGenerated) {
    return { text: '大纲已生成', type: 'success' }
  }
  if (props.project.architectureGenerated) {
    return { text: '架构已生成', type: 'warning' }
  }
  return { text: '待生成', type: 'info' }
})

const genreText = computed(() => {
  const genre = props.project?.genre
  if (Array.isArray(genre)) return genre.join(' / ')
  return genre || ''
})

// Calculate progress - 计算进度
const progress = computed(() => {
  let completed = 0
  if (props.project.coreSeed) completed++
  if (props.project.characterDynamics) completed++
  if (props.project.worldBuilding) completed++
  if (props.project.plotArchitecture) completed++
  if (props.project.chapterBlueprint) completed++
  return Math.round((completed / 5) * 100)
})
</script>

<template>
  <div 
    class="bg-white dark:bg-[#1f1f23] rounded-2xl border border-gray-200/80 dark:border-gray-700/50 overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-all duration-300"
    @click="emit('click')"
  >
    <!-- Gradient accent bar -->
    <!-- <div class="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity"></div> -->
    
    <div class="p-5">
      <!-- Title and actions - 标题和操作 -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {{ project.title }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ genreText }} · {{ project.numberOfChapters }} 章
          </p>
        </div>
        
        <!-- Delete button - 删除按钮 -->
        <n-button 
          circle
          quaternary
          size="small"
          class="opacity-0 group-hover:opacity-100 transition-opacity !ml-2"
          @click.stop="emit('delete')"
        >
          <template #icon>
            <n-icon class="text-gray-400 hover:text-red-500"><TrashOutline /></n-icon>
          </template>
        </n-button>
      </div>

      <!-- Topic preview - 主题预览 -->
      <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 leading-relaxed">
        {{ project.topic }}
      </p>

      <!-- Progress bar - 进度条 -->
      <div class="mb-4">
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>生成进度</span>
          <span class="font-medium">{{ progress }}%</span>
        </div>
        <n-progress 
          type="line"
          :percentage="progress" 
          :height="6"
          :show-indicator="false"
          :border-radius="4"
          rail-color="rgba(0,0,0,0.05)"
          :fill-border-radius="4"
        />
      </div>

      <!-- Footer info - 底部信息 -->
      <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
        <n-tag :type="statusInfo.type" size="small" :bordered="false" round>
          {{ statusInfo.text }}
        </n-tag>
        <span class="text-xs text-gray-400">
          {{ formatDate(project.updatedAt) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
