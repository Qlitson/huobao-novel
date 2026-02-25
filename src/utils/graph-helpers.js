/**
 * Graph Helpers - 图谱工具函数
 */

// 关系类型 → 颜色映射
export const RELATION_COLORS = {
  hostile: '#ef4444',
  romantic: '#ec4899',
  alliance: '#f59e0b',
  neutral: '#9ca3af',
  family: '#3b82f6',
  mentor: '#22c55e'
}

// 关系类型 → 中文标签
export const RELATION_LABELS = {
  hostile: '敌对',
  romantic: '情感',
  alliance: '同盟',
  neutral: '中立',
  family: '亲属',
  mentor: '师徒'
}

// 实体类型 → ECharts symbol 映射
export const NODE_SHAPES = {
  character: 'circle',
  faction: 'diamond',
  location: 'rect',
  item: 'triangle'
}

// 实体类型 → 中文标签
export const NODE_TYPE_LABELS = {
  character: '角色',
  faction: '阵营',
  location: '地点',
  item: '道具'
}

// 阵营 → 颜色（动态分配）
const FACTION_PALETTE = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#14b8a6',
  '#f97316', '#ef4444', '#ec4899', '#84cc16'
]

/**
 * 为阵营分配颜色
 */
export function getFactionColorMap(nodes) {
  const factions = [...new Set(nodes.filter(n => n.faction).map(n => n.faction))]
  const map = {}
  factions.forEach((f, i) => {
    map[f] = FACTION_PALETTE[i % FACTION_PALETTE.length]
  })
  return map
}

/**
 * 获取指定章节的最近快照
 * 从 snapshots 中找到 <= chapterNum 的最大 key
 */
export function getSnapshotForChapter(snapshots, chapterNum) {
  if (!snapshots || Object.keys(snapshots).length === 0) return null
  const keys = Object.keys(snapshots).map(Number).sort((a, b) => a - b)
  let best = null
  for (const k of keys) {
    if (k <= chapterNum) best = k
    else break
  }
  return best !== null ? snapshots[String(best)] : null
}

/**
 * 获取所有有快照的章节号列表
 */
export function getSnapshotChapters(snapshots) {
  if (!snapshots) return []
  return Object.keys(snapshots).map(Number).sort((a, b) => a - b)
}

/**
 * 将快照/图谱数据转换为 ECharts graph series 所需格式
 */
export function toEChartsGraphData(snapshot, isDark = false, factionColorMap = {}) {
  if (!snapshot) return { nodes: [], links: [], categories: [] }

  const categorySet = new Set()
  snapshot.nodes.forEach(n => {
    if (n.faction) categorySet.add(n.faction)
  })
  const categoryList = [...categorySet]
  const categories = categoryList.map(name => ({
    name,
    itemStyle: { color: factionColorMap[name] || '#6366f1' }
  }))
  // 无阵营的归入"其他"
  categories.push({ name: '其他', itemStyle: { color: isDark ? '#a78bfa' : '#6366f1' } })

  // ECharts symbol 映射
  const ECHARTS_SYMBOLS = {
    character: 'circle',
    faction: 'diamond',
    location: 'rect',
    item: 'triangle'
  }

  const nodes = snapshot.nodes.map(node => {
    const isDeceased = node.status === 'deceased'
    const isOffline = node.status === 'offline'
    const size = 20 + (node.importance || 5) * 4
    const catIndex = node.faction ? categoryList.indexOf(node.faction) : categories.length - 1

    return {
      id: node.id,
      name: node.label,
      symbol: ECHARTS_SYMBOLS[node.type] || 'circle',
      symbolSize: size,
      category: catIndex,
      value: node.importance || 5,
      label: { show: size > 36 },
      itemStyle: {
        opacity: isDeceased ? 0.35 : isOffline ? 0.6 : 1,
        ...(isDeceased ? { color: '#6b7280' } : {})
      },
      _raw: node
    }
  })

  const links = snapshot.edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    value: edge.strength || 3,
    lineStyle: {
      color: RELATION_COLORS[edge.relationType] || '#9ca3af',
      width: Math.max(1, (edge.strength || 3) / 3),
      opacity: 0.6
    },
    _raw: edge
  }))

  return { nodes, links, categories }
}

/**
 * 将 delta 应用到快照上，生成新快照
 */
export function applyDelta(snapshot, delta) {
  const nodes = [...snapshot.nodes]
  const edges = [...snapshot.edges]

  // 新增节点
  if (delta.newNodes) {
    for (const n of delta.newNodes) {
      if (!nodes.find(x => x.id === n.id)) nodes.push(n)
    }
  }

  // 更新节点
  if (delta.updatedNodes) {
    for (const u of delta.updatedNodes) {
      const idx = nodes.findIndex(x => x.id === u.id)
      if (idx !== -1) nodes[idx] = { ...nodes[idx], ...u.changes }
    }
  }

  // 删除节点
  if (delta.removedNodeIds) {
    for (const id of delta.removedNodeIds) {
      const idx = nodes.findIndex(x => x.id === id)
      if (idx !== -1) nodes.splice(idx, 1)
    }
  }

  // 新增边
  if (delta.newEdges) {
    for (const e of delta.newEdges) {
      if (!edges.find(x => x.id === e.id)) edges.push(e)
    }
  }

  // 更新边
  if (delta.updatedEdges) {
    for (const u of delta.updatedEdges) {
      const idx = edges.findIndex(x => x.id === u.id)
      if (idx !== -1) {
        edges[idx] = { ...edges[idx], ...u.changes }
        if (u.changes.events) {
          edges[idx].events = [...(edges[idx].events || []), ...u.changes.events]
        }
      }
    }
  }

  // 删除边
  if (delta.removedEdgeIds) {
    for (const id of delta.removedEdgeIds) {
      const idx = edges.findIndex(x => x.id === id)
      if (idx !== -1) edges.splice(idx, 1)
    }
  }

  return { nodes, edges }
}

/**
 * 尝试从 LLM 响应中解析 JSON
 */
export function parseJsonResponse(text) {
  // 先直接尝试
  try {
    return JSON.parse(text)
  } catch {
    // 尝试提取 JSON 块
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * 生成导出用的独立 HTML
 */
export function generateExportHTML(graphData, projectTitle) {
  const snapshot = getSnapshotForChapter(graphData.snapshots, Infinity)
  if (!snapshot) return ''

  const factionColorMap = getFactionColorMap(snapshot.nodes)
  const { nodes, links, categories } = toEChartsGraphData(snapshot, true, factionColorMap)
  const dataJson = JSON.stringify({ nodes, links, categories })

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${projectTitle} - 人物关系图谱</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
<style>
  body { margin: 0; background: #0f172a; font-family: system-ui; overflow: hidden; }
  #graph { width: 100vw; height: 100vh; }
  .title { position: fixed; top: 16px; left: 16px; color: #e2e8f0; font-size: 18px; z-index: 10; text-shadow: 0 0 10px rgba(99,102,241,0.5); }
</style>
</head>
<body>
<div class="title">${projectTitle} - 人物关系图谱</div>
<div id="graph"></div>
<script>
var data = ${dataJson};
var chart = echarts.init(document.getElementById('graph'));
chart.setOption({
  tooltip: {},
  legend: [{ data: data.categories.map(function(c){ return c.name; }), textStyle: { color: '#e2e8f0' }, top: 20, right: 20 }],
  animationDuration: 1500,
  animationEasingUpdate: 'quinticInOut',
  series: [{
    type: 'graph',
    layout: 'force',
    data: data.nodes,
    links: data.links,
    categories: data.categories,
    roam: true,
    label: { position: 'right', formatter: '{b}', color: '#e2e8f0' },
    lineStyle: { curveness: 0.2 },
    emphasis: { focus: 'adjacency', lineStyle: { width: 6 } },
    force: { repulsion: 200, edgeLength: [80, 200], gravity: 0.1 }
  }]
});
window.addEventListener('resize', function(){ chart.resize(); });
<\/script>
</body>
</html>`
}
