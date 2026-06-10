window.worldCupArticles = {
  "tempo-breakpoint": {
    slug: "tempo-breakpoint",
    category: "公开分析 / 焦点战前瞻",
    requiresMember: false,
    summary: "适合公开展示的赛前分析内容，重点讲清节奏拐点和关键变量。",
    sourceKeys: ["statsbomb_open", "football_data_api", "fifa_platform"],
    title: "焦点战中的节奏拐点与阵容变量",
    eyebrow: "公开分析 / 焦点战前瞻",
    description:
      "这是一篇适合公开展示的赛前分析文章，重点把比赛节奏、代表性变量和判断依据讲清楚。",
    meta: ["发布时间：2026-06-09", "作者：World Cup Edge 分析组", "分类：公开分析 / 焦点战"],
    focus: ["强队推进效率是否稳定", "边路对位能否形成压制", "临场名单会不会改变节奏预期"],
    sections: [
      {
        label: "01 / 比赛背景",
        heading: "这场比赛为什么值得重点跟踪",
        body:
          "两支高关注球队在赛程压力、阵容完整度和执行力上都有足够讨论空间。这类比赛最容易出现基本面接近，但节奏和临场变量拉开差距的情况。",
      },
      {
        label: "02 / 数据判断",
        heading: "先看节奏和推进，而不是只看名气",
        body:
          "推进效率、射门质量、后场失误率和回收速度，往往比单纯的历史名气更有解释力。",
        stats: [
          { label: "推进效率", value: "高优先级", text: "决定比赛是否容易进入强队主导节奏。" },
          { label: "射门转化", value: "中高优先级", text: "决定优势是否能真正落到比分层面。" },
          { label: "回收速度", value: "关键变量", text: "决定被反击时是否容易失位。" },
        ],
      },
      {
        label: "03 / 判断框架",
        heading: "公开内容也必须给出明确判断框架",
        body:
          "公开文章不能只是摆概念，而要让读者看完后知道你真正关心什么变量，以及这场比赛的关键分界点在哪里。",
      },
    ],
  },
  "group-stage-window": {
    slug: "group-stage-window",
    category: "公开分析 / 小组赛观察",
    requiresMember: false,
    summary: "适合公开展示的小组赛观察内容，重点是节奏分层和进球区间判断。",
    sourceKeys: ["statsbomb_open", "football_data_api"],
    title: "小组赛节奏判断与进球区间观察",
    eyebrow: "公开分析 / 小组赛观察",
    description:
      "这篇内容重点解释小组赛为什么常常不按照纸面实力直接展开，以及哪些结构性变量会影响进球区间。",
    meta: ["发布时间：2026-06-08", "作者：World Cup Edge 数据组", "分类：公开分析 / 小组赛"],
    focus: ["比赛会不会快速拉开节奏", "中后段体能变化是否明显", "防守型球队是否愿意提线反击"],
    sections: [
      {
        label: "01 / 比赛结构",
        heading: "小组赛阶段最常见的误区是只看名气",
        body:
          "在小组赛阶段，名气和纸面实力并不一定直接映射到比赛节奏。有些球队在领先预期下会主动收节奏，而不是继续扩大比分。",
      },
      {
        label: "02 / 进球区间",
        heading: "关键不是进球多不多，而是谁主导比赛形态",
        body:
          "当两支球队都不愿意在上半场过度冒险时，比赛更容易进入中低速状态。这时候更应该判断节奏形态，而不是被大众预期带着走。",
      },
      {
        label: "03 / 观察重点",
        heading: "公开文章也要给出清晰的比赛框架",
        body:
          "这类文章的任务是让读者知道，你不是只给一句判断，而是能把比赛走势拆成清晰可读的几个关键部分。",
      },
    ],
  },
  "lineup-and-odds": {
    slug: "lineup-and-odds",
    category: "会员深度 / 阵容与修正",
    requiresMember: true,
    summary: "会员深度内容，重点是临场名单、阵容变化和判断修正。",
    sourceKeys: ["statsbomb_open", "football_data_api", "fifa_platform"],
    title: "阵容变量、名单变化与赛前修正",
    eyebrow: "会员深度 / 深度内容",
    description:
      "这篇内容重点解释阵容变化、临场波动和更深的修正逻辑。",
    meta: ["发布时间：2026-06-10", "作者：World Cup Edge 深度组", "分类：会员深度 / 深度内容"],
    focus: ["首发名单是否出现关键轮换", "哪些变化会改变原判断", "临场信息如何影响更深层内容"],
    sections: [
      {
        label: "01 / 名单影响",
        heading: "阵容信息往往是最直接的修正信号",
        body:
          "同样的数据框架，一旦首发名单出现核心球员缺失、边后卫轮换或中场拦截点变化，比赛结构就会明显不同。",
      },
      {
        label: "02 / 修正逻辑",
        heading: "深度内容真正的价值，是告诉你哪里该改",
        body:
          "深度内容不只是再讲一遍基本面，而是要在变量变化后迅速说明哪些判断仍成立，哪些判断必须降级或调整。",
      },
      {
        label: "03 / 深度更新",
        heading: "更完整的推演放在会员内容里展开",
        body:
          "完整推演、修正后的判断和更细的后续内容，会在会员文章里持续更新。",
      },
    ],
  },
};
