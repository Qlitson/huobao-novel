<script setup>
import { computed } from 'vue'
import { NCollapse, NCollapseItem, NTag, NButton, NIcon, NEmpty } from 'naive-ui'
import { WarningOutline, AlertCircleOutline, InformationCircleOutline, LocationOutline } from '@vicons/ionicons5'

const props = defineProps({
  audit: Object,
  visible: Boolean
})

const emit = defineEmits(['locate', 'close'])

const severityConfig = {
  error: { type: 'error', icon: AlertCircleOutline, label: '严重' },
  warning: { type: 'warning', icon: WarningOutline, label: '警告' },
  info: { type: 'info', icon: InformationCircleOutline, label: '建议' }
}

const inconsistencies = computed(() => props.audit?.inconsistencies || [])

const grouped = computed(() => {
  const groups = { error: [], warning: [], info: [] }
  inconsistencies.value.forEach(item => {
    const key = item.severity || 'info'
    if (groups[key]) groups[key].push(item)
    else groups.info.push(item)
  })
  return groups
})

const errorCount = computed(() => grouped.value.error.length)
const warningCount = computed(() => grouped.value.warning.length)
const infoCount = computed(() => grouped.value.info.length)

function handleLocate(item) {
  emit('locate', {
    nodeIds: item.nodeIds || [],
    edgeIds: item.edgeIds || [],
    chapters: item.chapters || []
  })
}
</script>

<template>
  <transition name="slide-right">
    <div
      v-if="visible"
      class="w-80 h-full bg-white dark:bg-[#1f1f23] border-l border-gray-200/80 dark:border-gray-700/50 flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-gray-700/50">
        <div class="flex items-center gap-2">
          <WarningOutline class="w-5 h-5 text-amber-500" />
          <span class="font-semibold text-gray-800 dark:text-white">逻辑审计</span>
        </div>
        <div class="flex items-center gap-1.5">
          <n-tag v-if="errorCount" type="error" size="small" :bordered="false" round>{{ errorCount }}</n-tag>
          <n-tag v-if="warningCount" type="warning" size="small" :bordered="false" round>{{ warningCount }}</n-tag>
          <n-tag v-if="infoCount" type="info" size="small" :bordered="false" round>{{ infoCount }}</n-tag>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto">
        <div v-if="inconsistencies.length === 0" class="p-8">
          <n-empty description="未发现逻辑问题" />
        </div>

        <div v-else class="p-3">
          <n-collapse :default-expanded-names="['error', 'warning']">
            <template v-for="(items, severity) in grouped" :key="severity">
              <n-collapse-item
                v-if="items.length > 0"
                :name="severity"
              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <component
                      :is="severityConfig[severity]?.icon || InformationCircleOutline"
                      class="w-4 h-4"
                    />
                    <span>{{ severityConfig[severity]?.label || severity }}</span>
                    <n-tag size="tiny" :bordered="false" round>{{ items.length }}</n-tag>
                  </div>
                </template>

                <div class="space-y-2">
                  <div
                    v-for="(item, i) in items"
                    :key="i"
                    class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    @click="handleLocate(item)"
                  >
                    <div class="text-gray-700 dark:text-gray-200 mb-1">
                      {{ item.message }}
                    </div>
                    <div class="flex items-center gap-2 text-xs text-gray-400">
                      <span v-if="item.chapters?.length">
                        章节: {{ item.chapters.join(', ') }}
                      </span>
                      <n-button quaternary size="tiny" @click.stop="handleLocate(item)">
                        <template #icon>
                          <n-icon size="12"><LocationOutline /></n-icon>
                        </template>
                        定位
                      </n-button>
                    </div>
                  </div>
                </div>
              </n-collapse-item>
            </template>
          </n-collapse>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="audit?.lastAuditAt" class="px-4 py-2 border-t border-gray-200/80 dark:border-gray-700/50 text-xs text-gray-400">
        上次审计: {{ new Date(audit.lastAuditAt).toLocaleString('zh-CN') }}
      </div>
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
