// Chapter import helpers - 已有章节导入工具函数

/**
 * 从整本文本中解析出章节内容。
 * 默认按照「第X章」样式来切分。
 *
 * 支持示例：
 * 第1章 开端
 * 第 2 章
 *
 * @param {string} raw
 * @returns {{ [chapterNumber: number]: string }}
 */
export function parseChaptersFromText(raw) {
  if (!raw) return {}

  const text = String(raw)
  const pattern = /(第\s*(\d+)\s*章[^\n]*)([\s\S]*?)(?=第\s*\d+\s*章[^\n]*|$)/g
  const chapters = {}

  let match
  while ((match = pattern.exec(text)) !== null) {
    const header = match[1] || ''
    const num = parseInt(match[2], 10)
    const body = match[3] || ''

    if (!Number.isNaN(num)) {
      const content = `${header}\n${body}`.trim()
      if (content) {
        chapters[num] = content
      }
    }
  }

  return chapters
}

