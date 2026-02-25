/**
 * Compass Prompts - 灵感罗盘提示词
 * 用于从小说数据中提取实体关系图谱
 */

/**
 * 从架构数据提取完整图谱（基线快照）
 */
export const extractGraph = (params) => `
你是一个小说分析引擎。请从以下小说架构数据中提取实体关系图谱，输出严格的 JSON。

=== 角色体系 ===
${params.characterDynamics}

=== 角色状态 ===
${params.characterState}

=== 世界观 ===
${params.worldBuilding}

=== 情节架构 ===
${params.plotArchitecture}

请提取以下四类实体：
1. character（角色）：所有命名角色
2. faction（阵营/组织）：明确的组织、门派、势力
3. location（地点）：重要场景地点
4. item（物品）：关键道具、武器、信物

以及实体间的关系，关系类型限定为：
- hostile（敌对）、romantic（情感/恋爱）、alliance（同盟/契约）
- neutral（中立）、family（亲属）、mentor（师徒/指导）

输出格式（严格 JSON，不要任何解释文字）：
{
  "nodes": [
    {
      "id": "char_<拼音简写>",
      "label": "角色名",
      "type": "character",
      "importance": 8,
      "faction": "阵营名或null",
      "status": "active",
      "bio": "一句话简介",
      "traits": ["特征1", "特征2"],
      "firstAppearance": 0
    }
  ],
  "edges": [
    {
      "id": "edge_<source>_<target>",
      "source": "char_xxx",
      "target": "char_yyy",
      "relationType": "alliance",
      "label": "关系简述",
      "strength": 7,
      "description": "详细关系描述",
      "events": ["关键事件1"]
    }
  ]
}

要求：
- importance 范围 1-10，主角 9-10，重要配角 5-7，龙套 1-4
- strength 范围 1-10，核心关系 7-10，一般关系 3-6
- 每个 node 的 id 必须唯一，使用类型前缀 + 拼音简写（如 char_zhangsan, fac_zhengdao, loc_liuxi, item_hanjian）
- 仅输出 JSON，不要 markdown 代码块标记
`

/**
 * 从章节内容提取增量变更（delta）
 */
export const extractChapterDelta = (params) => `
你是一个小说分析引擎。请分析以下章节内容，输出关系图谱的变更（delta），严格 JSON 格式。

=== 当前图谱状态 ===
节点：${JSON.stringify(params.currentNodes.map(n => ({ id: n.id, label: n.label, type: n.type, status: n.status })))}
关系：${JSON.stringify(params.currentEdges.map(e => ({ id: e.id, source: e.source, target: e.target, relationType: e.relationType, label: e.label })))}

=== 第 ${params.chapterNumber} 章内容 ===
${params.chapterText}

请分析本章内容，输出以下变更：

{
  "newNodes": [
    { "id": "char_xxx", "label": "名字", "type": "character", "importance": 5, "faction": null, "status": "active", "bio": "简介", "traits": [], "firstAppearance": ${params.chapterNumber} }
  ],
  "updatedNodes": [
    { "id": "已有节点id", "changes": { "status": "deceased", "importance": 7 } }
  ],
  "removedNodeIds": [],
  "newEdges": [
    { "id": "edge_x_y", "source": "char_x", "target": "char_y", "relationType": "hostile", "label": "关系", "strength": 5, "description": "描述", "events": ["事件"] }
  ],
  "updatedEdges": [
    { "id": "已有边id", "changes": { "relationType": "hostile", "strength": 9, "events": ["新事件"] } }
  ],
  "removedEdgeIds": []
}

要求：
- 仅输出有变化的内容，没有变化的字段不要包含
- 如果本章没有任何变化，所有数组返回空 []
- 角色死亡时 status 改为 "deceased"，角色暂时离场改为 "offline"
- 关系转变时更新 relationType 和 events
- 仅输出 JSON，不要 markdown 代码块标记
`

/**
 * 逻辑审计 - 检测图谱中的逻辑不一致
 */
export const auditGraph = (params) => `
你是一个小说逻辑审计引擎。请检查以下小说的关系图谱快照序列，找出逻辑不一致之处。

=== 章节大纲 ===
${params.chapterBlueprint}

=== 图谱快照序列 ===
${params.snapshotsText}

请检查以下类型的逻辑问题：
1. dead_reappear：角色在某章死亡后，在后续章节又出现互动
2. missing_setup：两个角色突然产生关系，但之前没有任何铺垫
3. faction_conflict：角色的阵营归属与其关系网络矛盾
4. orphan_thread：某条关系线在中途断裂，没有后续发展也没有交代
5. weight_imbalance：配角戏份权重超过主角，可能抢夺主线

输出格式（严格 JSON）：
{
  "inconsistencies": [
    {
      "type": "dead_reappear",
      "severity": "error",
      "nodeIds": ["char_xxx"],
      "edgeIds": [],
      "chapters": [10, 15],
      "message": "角色XXX在第10章死亡，但第15章出现了与YYY的互动"
    }
  ]
}

severity 分为：error（严重逻辑错误）、warning（潜在问题）、info（建议优化）
仅输出 JSON，不要 markdown 代码块标记
`

/**
 * 从单章内容提取完整关系图谱（用于章节写作面板内嵌图谱）
 */
export const extractChapterGraph = (params) => `
你是一个小说分析引擎。请从以下单章内容中提取本章涉及的人物关系图谱，输出严格 JSON。

=== 第 ${params.chapterNumber} 章内容 ===
${params.chapterText}

${params.characterState ? `=== 当前角色状态 ===\n${params.characterState}\n` : ''}

请提取本章中出场的所有角色及其关系：

输出格式（严格 JSON，不要任何解释文字）：
{
  "nodes": [
    {
      "id": "char_<拼音简写>",
      "label": "角色名",
      "type": "character",
      "importance": 8,
      "faction": "阵营名或null",
      "status": "active",
      "bio": "本章中的角色表现（一句话）"
    }
  ],
  "edges": [
    {
      "source": "char_xxx",
      "target": "char_yyy",
      "relationType": "alliance",
      "label": "关系简述",
      "strength": 7
    }
  ]
}

要求：
- 仅提取本章中实际出场或被提及的角色
- importance 范围 1-10，本章戏份越多越高
- strength 范围 1-10，本章互动越密切越高
- relationType 限定为：hostile / romantic / alliance / neutral / family / mentor
- 仅输出 JSON，不要 markdown 代码块标记
`

export const compassPrompts = {
  extractGraph,
  extractChapterDelta,
  auditGraph,
  extractChapterGraph
}
