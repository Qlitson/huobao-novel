<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelStore } from '../stores/novel'
import { useSettingsStore } from '../stores/settings'
import { useMessage, useDialog, NButton, NIcon } from 'naive-ui'
import { AddOutline, DocumentTextOutline, RocketOutline, PersonOutline, TrendingUpOutline } from '@vicons/ionicons5'
import CreateProjectDialog from '../components/CreateProjectDialog.vue'
import ProjectCard from '../components/ProjectCard.vue'

const router = useRouter()
const novelStore = useNovelStore()
const settings = useSettingsStore()
const message = useMessage()
const dialog = useDialog()

const showCreateDialog = ref(false)

// Delete project with confirmation - 确认后删除项目
async function handleDelete(project) {
  dialog.warning({
    title: '删除确认',
    content: `确定要删除项目 "${project.title}" 吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      novelStore.deleteProject(project.id)
      message.success('项目已删除')
    }
  })
}

// Open project - 打开项目
function openProject(project) {
  router.push(`/project/${project.id}`)
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- Hero Section - 英雄区域 -->
    <div class="text-center py-16 mb-8">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6">
        <RocketOutline class="w-4 h-4" />
        基于雪花写作法的 AI 创作工具
      </div>
      <h1 class="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
        AI 小说生成器
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
        智能生成小说架构、角色体系、世界观和章节大纲，让创作更高效
      </p>
      
      <!-- Quick start button - 快速开始按钮 -->
      <n-button 
        type="primary" 
        size="large"
        @click="showCreateDialog = true"
        class="!px-8 !h-12 !text-base"
      >
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        创建新项目
      </n-button>
    </div>

    <!-- Projects Grid - 项目网格 -->
    <div v-if="novelStore.hasProjects" class="mb-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-800 dark:text-white">
          我的项目
          <span class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
            ({{ novelStore.projectList.length }})
          </span>
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectCard
          v-for="project in novelStore.projectList"
          :key="project.id"
          :project="project"
          @click="openProject(project)"
          @delete="handleDelete(project)"
        />
      </div>
    </div>

    <!-- Empty State - 空状态 -->
    <div 
      v-else 
      class="text-center py-20 bg-white dark:bg-[#1f1f23] rounded-2xl border border-gray-200/80 dark:border-gray-700/50"
    >
      <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
        <DocumentTextOutline class="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">还没有项目</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">点击上方按钮创建你的第一个小说项目</p>
    </div>

    <!-- Features Section - 功能介绍 -->
    <div class="mt-20 mb-12">
      <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-10">核心功能</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-[#1f1f23] rounded-2xl p-6 border border-gray-200/80 dark:border-gray-700/50 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-all duration-300 group">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
            <RocketOutline class="w-7 h-7 text-white" />
          </div>
          <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-3">雪花写作法</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            从核心种子开始，逐步扩展角色、世界观、情节架构，构建完整故事
          </p>
        </div>

        <div class="bg-white dark:bg-[#1f1f23] rounded-2xl p-6 border border-gray-200/80 dark:border-gray-700/50 hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-300 dark:hover:border-purple-600/50 transition-all duration-300 group">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
            <PersonOutline class="w-7 h-7 text-white" />
          </div>
          <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-3">角色弧光理论</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            设计具有动态变化潜力的角色，包含驱动力三角和关系冲突网
          </p>
        </div>

        <div class="bg-white dark:bg-[#1f1f23] rounded-2xl p-6 border border-gray-200/80 dark:border-gray-700/50 hover:shadow-xl hover:shadow-rose-500/5 hover:border-rose-300 dark:hover:border-rose-600/50 transition-all duration-300 group">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center mb-5 shadow-lg shadow-rose-500/25 group-hover:scale-110 transition-transform">
            <TrendingUpOutline class="w-7 h-7 text-white" />
          </div>
          <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-3">悬念节奏曲线</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            智能规划章节节奏，设置认知过山车，保持读者阅读兴趣
          </p>
        </div>
      </div>
    </div>

    <!-- Create Project Dialog - 创建项目对话框 -->
    <CreateProjectDialog v-model="showCreateDialog" />
  </div>
</template>
