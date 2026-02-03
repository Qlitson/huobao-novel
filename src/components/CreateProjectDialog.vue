<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelStore } from '../stores/novel'
import { useMessage } from 'naive-ui'
import { NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, NSpace, NIcon } from 'naive-ui'
import { CheckmarkOutline } from '@vicons/ionicons5'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()
const novelStore = useNovelStore()
const message = useMessage()

// Form data - 表单数据
const formRef = ref(null)
const form = reactive({
  title: '',
  topic: '',
  genre: ['玄幻'],
  numberOfChapters: 100,
  wordNumber: 3000,
  userGuidance: ''
})

// Genre options - 类型选项
const genreOptions = [
  { label: '玄幻', value: '玄幻' },
  { label: '仙侠', value: '仙侠' },
  { label: '都市', value: '都市' },
  { label: '历史', value: '历史' },
  { label: '科幻', value: '科幻' },
  { label: '游戏', value: '游戏' },
  { label: '悬疑', value: '悬疑' },
  { label: '奇幻', value: '奇幻' },
  { label: '武侠', value: '武侠' },
  { label: '言情', value: '言情' },
  { label: '军事', value: '军事' },
  { label: '体育', value: '体育' },
  { label: '灵异', value: '灵异' },
  { label: '二次元', value: '二次元' },
  { label: '其他', value: '其他' }
]

// Form rules - 表单规则
const rules = {
  title: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  topic: [{ required: true, message: '请输入小说主题', trigger: 'blur' }],
  genre: [
    {
      required: true,
      trigger: 'change',
      validator: (_rule, value) => {
        if (Array.isArray(value) && value.length > 0) return true
        return new Error('请选择小说类型')
      }
    }
  ],
  numberOfChapters: [{ required: true, message: '请输入章节数量', trigger: 'blur', type: 'number' }],
  wordNumber: [{ required: true, message: '请输入每章字数', trigger: 'blur', type: 'number' }]
}

// Reset form when dialog opens - 打开对话框时重置表单
watch(() => props.modelValue, (val) => {
  if (val) {
    form.title = ''
    form.topic = ''
    form.genre = ['玄幻']
    form.numberOfChapters = 100
    form.wordNumber = 3000
    form.userGuidance = ''
  }
})

// Create project - 创建项目
async function createProject() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const project = novelStore.createProject({
      title: form.title,
      topic: form.topic,
      genre: form.genre,
      numberOfChapters: form.numberOfChapters,
      wordNumber: form.wordNumber,
      userGuidance: form.userGuidance
    })
    
    message.success('项目创建成功')
    emit('update:modelValue', false)
    router.push(`/project/${project.id}`)
  } catch (error) {
    // Validation failed
  }
}
</script>

<template>
  <n-modal
    :show="modelValue"
    @update:show="emit('update:modelValue', $event)"
    :mask-closable="false"
    preset="card"
    title="创建新项目"
    style="width: 620px"
    :bordered="false"
    class="!rounded-2xl"
  >
    <n-form 
      ref="formRef"
      :model="form" 
      :rules="rules"
      label-placement="top"
      class="space-y-1"
    >
      <!-- Project title - 项目名称 -->
      <n-form-item label="项目名称" path="title">
        <n-input 
          v-model:value="form.title" 
          placeholder="例如：星辰大海"
          :maxlength="50"
          show-count
        />
      </n-form-item>

      <!-- Novel topic - 小说主题 -->
      <n-form-item label="小说主题 / 核心创意" path="topic">
        <n-input 
          v-model:value="form.topic" 
          type="textarea"
          :rows="3"
          placeholder="描述你的小说核心创意，例如：一个普通少年意外获得神秘传承，在修仙世界中逐步成长..."
          :maxlength="500"
          show-count
        />
      </n-form-item>

      <!-- Genre selection - 类型选择 -->
      <n-form-item label="小说类型" path="genre">
        <n-select 
          v-model:value="form.genre" 
          :options="genreOptions"
          multiple
          class="w-full"
        />
      </n-form-item>

      <!-- Chapter count and word count - 章节数和字数 -->
      <div class="grid grid-cols-2 gap-4">
        <n-form-item label="预计章节数" path="numberOfChapters">
          <n-input-number 
            v-model:value="form.numberOfChapters" 
            :min="10" 
            :max="500"
            :step="10"
            class="w-full"
          />
        </n-form-item>

        <n-form-item label="每章字数" path="wordNumber">
          <n-input-number 
            v-model:value="form.wordNumber" 
            :min="1000" 
            :max="10000"
            :step="500"
            class="w-full"
          />
        </n-form-item>
      </div>

      <!-- User guidance - 用户指导 -->
      <n-form-item label="创作指导 (可选)">
        <n-input 
          v-model:value="form.userGuidance" 
          type="textarea"
          :rows="3"
          placeholder="可以在这里添加额外的创作要求，如特定角色设定、情节走向、写作风格等..."
          :maxlength="1000"
          show-count
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('update:modelValue', false)">取消</n-button>
        <n-button type="primary" @click="createProject">
          <template #icon>
            <n-icon><CheckmarkOutline /></n-icon>
          </template>
          创建项目
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
