<script setup>
import { ref, watch } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useMessage } from 'naive-ui'
import { NModal, NCard, NForm, NFormItem, NInput, NButton, NSpace, NIcon, NTooltip, NTabs, NTabPane, NSelect, NAutoComplete } from 'naive-ui'
import { FlashOutline, HelpCircleOutline } from '@vicons/ionicons5'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const settings = useSettingsStore()
const message = useMessage()

// Channel configurations - 渠道配置
const channels = [
  { 
    id: 'chatfire', 
    name: 'Chatfire',
    baseUrl: 'https://api.chatfire.site/v1',
    models: [
      // 'gpt-4o',
      // 'claude-sonnet-4-5-20250929',
      // 'kimi-k2-thinking',
      'gemini-3-flash-preview',
      'doubao-seed-1-8-251228',
      'gemini-3-pro-preview',
      // 'gemini-2.5-pro'
    ]
  },
  // { 
  //   id: 'openai', 
  //   name: 'OpenAI',
  //   baseUrl: 'https://api.openai.com/v1',
  //   models: ['gpt-5.2', 'gpt-4o', 'gpt-4o-mini']
  // },
  // { 
  //   id: 'gemini', 
  //   name: 'Google Gemini',
  //   baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  //   models: ['gemini-2.5-pro', 'gemini-3-pro-preview']
  // }
]

// Current channel - 当前渠道
const currentChannel = ref('chatfire')

// Channel options for select - 渠道选项
const channelOptions = channels.map(c => ({ label: c.name, value: c.id }))

// Current channel models - 当前渠道的模型列表
import { computed } from 'vue'
const currentChannelModels = computed(() => {
  const channel = channels.find(c => c.id === currentChannel.value)
  return channel?.models.map(m => ({ label: m, value: m })) || []
})

// Initialize with default values - 使用默认值初始化
const localConfig = ref({
  channel: 'chatfire',
  baseUrl: 'https://api.chatfire.site/v1',
  apiKey: '',
  model: 'gemini-3-flash-preview',
  temperature: 0.7,
  maxTokens: 8192,
  timeout: 600
})

// Handle channel change - 处理渠道切换
function handleChannelChange(channelId) {
  currentChannel.value = channelId
  const channel = channels.find(c => c.id === channelId)
  if (channel) {
    localConfig.value.channel = channelId
    localConfig.value.baseUrl = channel.baseUrl
    localConfig.value.model = channel.models[0] || ''
  }
}

// Stage-specific models - 各环节模型配置
const localStageModels = ref({
  architecture: '',
  blueprint: '',
  chapter: '',
  finalize: '',
  enrich: ''
})

// Stage labels - 环节标签
const stageLabels = {
  architecture: '架构生成',
  blueprint: '大纲生成',
  chapter: '章节生成',
  finalize: '定稿处理',
  enrich: '章节扩写'
}

// Sync local config when dialog opens - 打开对话框时同步本地配置
watch(() => props.modelValue, (val) => {
  if (val) {
    localConfig.value = { ...settings.apiConfig }
    localStageModels.value = { ...settings.stageModels }
    currentChannel.value = localConfig.value.channel || 'chatfire'
  }
}, { immediate: true })

// Save settings - 保存设置
function saveSettings() {
  if (!localConfig.value.apiKey) {
    message.warning('请输入 API Key')
    return
  }
  settings.updateApiConfig(localConfig.value)
  settings.updateStageModels(localStageModels.value)
  message.success('设置已保存')
  emit('update:modelValue', false)
}

// Test connection - 测试连接
async function testConnection() {
  if (!localConfig.value.apiKey) {
    message.warning('请先输入 API Key')
    return
  }
  
  try {
    const response = await fetch(`${localConfig.value.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${localConfig.value.apiKey}`
      }
    })
    
    if (response.ok) {
      message.success('连接成功!')
    } else {
      message.error('连接失败: ' + response.status)
    }
  } catch (error) {
    message.error('连接失败: ' + error.message)
  }
}

function goToGetKey() {
  window.open('https://api.chatfire.site/login?inviteCode=EEE80324', '_blank')
}
</script>

<template>
  <n-modal
    :show="modelValue"
    @update:show="emit('update:modelValue', $event)"
    :mask-closable="false"
    preset="card"
    title="API 设置"
    style="width: 520px"
    :bordered="false"
    class="!rounded-2xl"
  >
    <n-form label-placement="top" class="space-y-1">
      <!-- Channel Select -->
      <n-form-item label="渠道">
        <n-select
          :value="currentChannel"
          :options="channelOptions"
          @update:value="handleChannelChange"
        />
      </n-form-item>

      <!-- API Base URL -->
      <n-form-item label="API Base URL">
        <n-input 
          v-model:value="localConfig.baseUrl" 
          placeholder="https://api.chatfire.site/v1"
        />
      </n-form-item>

      <!-- API Key -->
      <n-form-item label="API Key">
        <n-input 
          v-model:value="localConfig.apiKey" 
          type="password"
          placeholder="请输入 API Key"
          show-password-on="click"
        />
      </n-form-item>

      <!-- Default Model -->
      <n-form-item>
        <template #label>
          <div class="flex items-center gap-1">
            <span>默认模型</span>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-icon class="text-gray-400 cursor-help" :size="14">
                  <HelpCircleOutline />
                </n-icon>
              </template>
              未单独配置环节模型时使用此模型
            </n-tooltip>
          </div>
        </template>
<n-auto-complete
          v-model:value="localConfig.model"
          :options="currentChannelModels"
          :get-show="() => true"
          placeholder="选择或输入模型名称"
          clearable
        />
      </n-form-item>

      <!-- Stage-specific Models -->
      <div class="mt-4">
        <div class="flex items-center gap-1 mb-3">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">各环节模型配置</span>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-icon class="text-gray-400 cursor-help" :size="14">
                <HelpCircleOutline />
              </n-icon>
            </template>
            留空则使用默认模型
          </n-tooltip>
        </div>
        <n-tabs type="segment" size="small">
          <n-tab-pane v-for="(label, key) in stageLabels" :key="key" :name="key" :tab="label">
<n-auto-complete
              v-model:value="localStageModels[key]"
              :options="currentChannelModels"
              :get-show="() => true"
              placeholder="留空使用默认模型"
              class="mt-3"
              clearable
            />
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-form>

    <template #footer>
      <div class="flex justify-between">
        <n-space>
          <n-button @click="goToGetKey" tertiary>
            获取 Key
          </n-button>
          <!-- <n-button @click="testConnection" tertiary>
            <template #icon>
              <n-icon><FlashOutline /></n-icon>
            </template>
            测试连接
          </n-button> -->
        </n-space>
        <n-space>
          <n-button @click="emit('update:modelValue', false)">取消</n-button>
          <n-button type="primary" @click="saveSettings">保存</n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>
