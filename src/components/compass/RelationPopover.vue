<script setup>
import { computed } from 'vue'
import { NTag } from 'naive-ui'
import { RELATION_LABELS, RELATION_COLORS } from '../../utils/graph-helpers'

const props = defineProps({
  edge: Object,
  allNodes: Array,
  visible: Boolean,
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 }
})

const emit = defineEmits(['close'])

const sourceNode = computed(() => {
  if (!props.edge || !props.allNodes) return null
  return props.allNodes.find(n => n.id === props.edge.source)
})

const targetNode = computed(() => {
  if (!props.edge || !props.allNodes) return null
  return props.allNodes.find(n => n.id === props.edge.target)
})
</script>

<template>
  <transition name="fade">
    <div
      v-if="visible && edge"
      class="fixed z-50 w-72 bg-white dark:bg-[#1f1f23] rounded-xl shadow-xl border border-gray-200/80 dark:border-gray-700/50 overflow-hidden"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click.stop
    >
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200/80 dark:border-gray-700/50">
        <div class="flex items-center gap-2 text-sm">
          <span class="font-medium text-gray-800 dark:text-white">
            {{ sourceNode?.label || edge.source }}
          </span>
          <span
            class="px-2 py-0.5 rounded-full text-xs text-white"
            :style="{ backgroundColor: RELATION_COLORS[edge.relationType] || '#9ca3af' }"
          >
            {{ RELATION_LABELS[edge.relationType] || edge.relationType }}
          </span>
          <span class="font-medium text-gray-800 dark:text-white">
            {{ targetNode?.label || edge.target }}
          </span>
        </div>
        <div class="text-xs text-gray-400 mt-1">
          关系强度 {{ edge.strength }}/10
        </div>
      </div>

      <!-- Description -->
      <div class="px-4 py-3">
        <div v-if="edge.description" class="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {{ edge.description }}
        </div>

        <!-- Events Timeline -->
        <div v-if="edge.events?.length" class="space-y-2">
          <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            关系大事件
          </div>
          <div
            v-for="(event, i) in edge.events"
            :key="i"
            class="flex items-start gap-2 text-sm"
          >
            <span
              class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
              :style="{ backgroundColor: RELATION_COLORS[edge.relationType] || '#9ca3af' }"
            />
            <span class="text-gray-600 dark:text-gray-300">{{ event }}</span>
          </div>
        </div>
      </div>

      <!-- Close hint -->
      <div class="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400 text-center">
        点击其他区域关闭
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
