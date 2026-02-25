<script setup>
import { ref, computed, watch } from 'vue'
import { NSlider, NButton, NIcon, NTag } from 'naive-ui'
import { PlayOutline, PauseOutline, PlaySkipBackOutline, PlaySkipForwardOutline } from '@vicons/ionicons5'
import { getSnapshotChapters } from '../../utils/graph-helpers'

const props = defineProps({
  snapshots: Object,
  maxChapter: { type: Number, default: 0 }
})

const emit = defineEmits(['chapter-change'])

const currentChapter = ref(0)
const isPlaying = ref(false)
let playTimer = null

const snapshotChapters = computed(() => getSnapshotChapters(props.snapshots))

const hasMultipleSnapshots = computed(() => snapshotChapters.value.length > 1)

const marks = computed(() => {
  const m = {}
  snapshotChapters.value.forEach(ch => {
    m[ch] = ch === 0 ? '基线' : `${ch}`
  })
  return m
})

const maxSliderValue = computed(() => {
  if (props.maxChapter > 0) return props.maxChapter
  const chapters = snapshotChapters.value
  return chapters.length > 0 ? Math.max(...chapters) : 0
})

function handleSliderChange(val) {
  currentChapter.value = val
  emit('chapter-change', val)
}

function stepBack() {
  const chapters = snapshotChapters.value
  const idx = chapters.findIndex(c => c >= currentChapter.value)
  const prevIdx = Math.max(0, (idx > 0 ? idx - 1 : 0))
  currentChapter.value = chapters[prevIdx] || 0
  emit('chapter-change', currentChapter.value)
}

function stepForward() {
  const chapters = snapshotChapters.value
  const idx = chapters.findIndex(c => c > currentChapter.value)
  if (idx !== -1) {
    currentChapter.value = chapters[idx]
  } else {
    currentChapter.value = chapters[chapters.length - 1] || 0
  }
  emit('chapter-change', currentChapter.value)
}

function togglePlay() {
  if (isPlaying.value) {
    stopPlay()
  } else {
    startPlay()
  }
}

function startPlay() {
  isPlaying.value = true
  const chapters = snapshotChapters.value
  let idx = chapters.findIndex(c => c >= currentChapter.value)
  if (idx === -1) idx = 0

  playTimer = setInterval(() => {
    idx++
    if (idx >= chapters.length) {
      stopPlay()
      return
    }
    currentChapter.value = chapters[idx]
    emit('chapter-change', currentChapter.value)
  }, 1500)
}

function stopPlay() {
  isPlaying.value = false
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}

watch(() => props.snapshots, () => {
  // 当快照更新时，如果当前章节超出范围，重置
  if (currentChapter.value > maxSliderValue.value) {
    currentChapter.value = 0
    emit('chapter-change', 0)
  }
}, { deep: true })
</script>

<template>
  <div
    v-if="hasMultipleSnapshots"
    class="px-4 py-3 bg-white dark:bg-[#1f1f23] rounded-xl border border-gray-200/80 dark:border-gray-700/50"
  >
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1">
        <n-button quaternary circle size="tiny" @click="stepBack" :disabled="isPlaying">
          <template #icon>
            <n-icon size="14"><PlaySkipBackOutline /></n-icon>
          </template>
        </n-button>

        <n-button quaternary circle size="small" @click="togglePlay">
          <template #icon>
            <n-icon size="16">
              <PauseOutline v-if="isPlaying" />
              <PlayOutline v-else />
            </n-icon>
          </template>
        </n-button>

        <n-button quaternary circle size="tiny" @click="stepForward" :disabled="isPlaying">
          <template #icon>
            <n-icon size="14"><PlaySkipForwardOutline /></n-icon>
          </template>
        </n-button>
      </div>

      <div class="flex-1">
        <n-slider
          :value="currentChapter"
          :min="0"
          :max="maxSliderValue"
          :step="1"
          :marks="marks"
          :disabled="isPlaying"
          @update:value="handleSliderChange"
        />
      </div>

      <n-tag size="small" :bordered="false" round class="flex-shrink-0">
        {{ currentChapter === 0 ? '基线' : `第 ${currentChapter} 章` }}
      </n-tag>
    </div>
  </div>
</template>
