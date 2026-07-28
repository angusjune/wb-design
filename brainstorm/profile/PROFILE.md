---
product: wb-app
productName: 微众银行APP
platform: ios
pageClass: wb-app-page
tokenPrefix: wb-app
---

# 微众银行APP (WB-APP) Product Profile

Everything in this file is specific to 微众银行APP 的基金模块. `SKILL.md` holds the method and points here for product facts. The frontmatter above is the machine-readable half of the profile — `scripts/serve-preview.cjs`、`scripts/run-qa-gate.mjs`、`npm run validate` 和站点构建都从这里读取 `platform`、`pageClass`、`tokenPrefix`。

Read this file at Step 3, before writing any screen HTML.

- **Product:** 微众银行APP (WeBank App) 的基金模块 — 原生 iOS App，非小程序
- **Page class:** `.wb-app-page` — 每屏都包在这个 class 里
- **Token prefix:** `--wb-app-*`（这份档案自己的前缀；共享机制不依赖它）

---

## Screen templates

Production-accurate HTML in `profile/screens/`, exported from Figma. **This table is checked against disk by `npm run validate`** — if a template exists on disk, it is listed here.

| Screen name | File | Description |
|-------------|------|-------------|
| 基金tab | `基金tab.html` | 基金发现首页 tab（App 5 项底部导航之一）：市场指数、大数据选基榜单卡片组、看热点/看精选、基金讨论区、学习积分福利、底部指数行情条 + 真实 Tab Bar |
| 基金详情页 | `基金详情页.html` | 单只基金详情：蓝色 hero、净值/业绩走势图表、最大回撤与夏普比率、持仓与行业分布、基金经理与公司、交易规则、评论区、底部购买栏 |
| 基金排行 | `基金排行.html` | 排行列表页：分类 tab + 周期切换 + 涨跌幅/夏普比率/最大回撤数据列 |
| 近3个月涨幅领先的基金 | `近3个月涨幅领先的基金.html` | 榜单页：红色 hero + 排名徽章卡片 + 每项「买一笔」CTA |

**When the user names a screen in Chinese** (e.g. "优化基金详情页样式"), read the matching file and use it as the base template.

## Which template to read

| Screen type | Read this file |
|-------------|---------------|
| 基金发现 / 首页 tab | `基金tab.html` |
| 单只基金详情 | `基金详情页.html` |
| 排行 / 分类筛选列表 | `基金排行.html` |
| 榜单 / 排名徽章卡片 | `近3个月涨幅领先的基金.html` |
| 涨跌幅数字（红涨绿跌） | 任意屏幕，参考 `profile/design-system/components.css` 里的 `.wb-fund-gain`/`.wb-fund-loss` |

**Canonical reference：** `基金tab.html` 是首页 tab 的基准屏——信息密度最高，是其余三屏的入口点。

---

## Design language

**Data-forward, trustworthy, mildly gamified.** 这是基金投资场景：设计允许（甚至鼓励）图表、排名、榜单和"学习领积分"式的轻度游戏化激励。

**Visual tone：** 白色卡片 + 浅灰页面背景（部分列表/榜单页整屏纯白）；主色蓝 `#456CE6` 用于交互（tab 选中、链接、进度条），主色橙 `#F99C4B` 专门保留给主流程 CTA（购买/定投）；涨跌幅用红/绿区分（中国市场惯例：**红涨绿跌**，与西方相反）。

**References：** 中国主流基金/理财 App（大数据选基、涨幅榜单、学习领积分等模式在同类产品中很常见）。

**Anti-references：** 不要套用"零促销、零游戏化"铁律——本产品的学习积分横幅、排名徽章、"HOT"角标都是产品原生设计，不是需要清除的促销噪音。

### Principles

1. **红涨绿跌，没有例外。** 所有涨跌幅数字必须用 `.wb-fund-gain`（红 `--wb-app-gain-500`）/`.wb-fund-loss`（绿 `--wb-app-loss-500`），不要凭直觉套用西方的红跌绿涨。
2. **千分位分隔符会用。** 大额数字（如管理规模"25,352.42亿"）保留千分位逗号，不要自作主张去掉逗号。
3. **橙色只留给主流程按钮。** `--wb-app-orange-500` 专用于"购买/定投"这类主要转化动作；蓝色 `--wb-app-theme-500` 用于次级交互（tab 选中、链接、进度条），两者不要混用。
4. **卡片圆角 12px，button/tag 圆角 8px。** 
5. **页面横向留白 12px。**
6. **导航栏可按屏着色。** 详情页/排行页用深蓝 `#3D60CC` 头部背景 + 白色状态栏图标（通过 `--chrome-navbar-bg`/`--chrome-fg`/`--chrome-tint` 覆盖，见下方"Preview chrome"）；榜单页用红色近似（真透明效果超出共享 chrome 能力范围）。
7. **合规/免责文案必须保留。** 涨跌幅数据更新时间、"不构成投资建议"、基金合同提示等法律文本，模板里有就必须原样保留。
8. **真实机构资料不得虚构替换。** 基金经理照片、基金公司 logo（如易方达基金管理有限公司）等来自 Figma 的真实素材，替换内容时同样需要用真实素材，不能用占位图。
9. **禁止 emoji。** 用 profile 自己的图标集或内联 SVG；如需新图标，优先从 Figma 导出真实资源，而不是手绘近似或用 emoji 顶替。

### Canonical CTA forms

- `基金详情页` — 底部固定操作栏：`加自选`（描边圆角方形）+ `定投`（浅橙描边）+ `购买`（实心橙，主 CTA）
- `近3个月涨幅领先的基金` — 每张排名卡片右侧的小号「买一笔」/「去看看」胶囊按钮
- `基金排行` — 无独立 CTA，列表本身可点击进入详情
- `基金tab` — 各榜单预览卡片内嵌「买一笔」，学习积分横幅内嵌「领取」/「查看」

### Preview chrome

Use the platform's own variants:

```html
<preview-chrome variant="home" title="基金"></preview-chrome>
<preview-chrome variant="inner" title="产品详情" trailing='<svg>...</svg>'></preview-chrome>
```

- `基金tab`（App 的一个 tab 根屏）用 `variant="home"`（无返回按钮，大标题="基金"）；自定义搜索栏是页面内容，不是 chrome 的一部分。
- 其余三屏用 `variant="inner"`，`title` 按各屏实际标题（`近3个月涨幅领先的基金.html` 标题留空，因为红色 hero 自带大标题，navbar 标题会重复）。
- 三屏（`基金排行`/`基金详情页`/`近3个月涨幅领先的基金`）通过覆盖 `--chrome-navbar-bg`/`--chrome-fg`/`--chrome-tint` 让 navbar 变色+白图标，写在各自模板底部 `<style>` 的 `:root` 覆盖里——这是本次 setup 里给共享 chrome 新增的能力（见平台包 iOS chrome 的 `--chrome-fg` 变量）。
- **导航栏尾部动作插槽**：平台包的 iOS chrome 现在支持 `<preview-chrome trailing="<svg>...</svg>">`（`{{trailing}}` 占位符，实现在平台包 iOS chrome 和共享预览服务脚本里），内容不转义、需自带 `currentColor` 才能跟随 `--chrome-fg`。`基金详情页`/`近3个月涨幅领先的基金` 的分享/导出图标用这个插槽；`基金tab`/`基金排行` 的收藏/客服图标不经过这里——它们在源设计里就是搜索栏本身的一部分（`.wb-fund-searchbar-row` 里的 `.wb-fund-searchbar-trailing`），不是系统导航栏内容。4 个图标都是手绘 SVG 复刻（真实 "-on dark" 资源的细描边在导出时抗锯齿严重，chroma-key 处理不干净），不是导出的原始矢量。

### Screen-specific styles

多屏共用的样式（`.wb-fund-gain`/`.wb-fund-loss`、`.wb-fund-tag`、`.wb-fund-searchbar*`、`.wb-app-page`/`.wb-app-page-body`）都在 `profile/design-system/components.css`；仅属于单个页面的样式留在模板底部的 `<style>` 中。改造模板时必须同时保留其局部样式。

---

## Product laws

Non-negotiable. These win over anything a template appears to show.

见上方 Design language → Principles（1–9 条），此处不重复。

---

## Passes

无产品专属 QA passes/rule-pack（`profile/quality/` 已删除）。9 条产品铁律中，可机械检查的部分（红涨绿跌、禁止 emoji）已由通用 `scripts/run-qa-gate.mjs` 的 `token-color`/`emoji` 规则覆盖；其余（CTA 配色语义、圆角/留白数值、合规文案覆盖范围）缺乏低误报的静态判断方式，不强行伪装成规则。

## Branches

第 8 步未处理，暂无产品专属分支。

| Branch | Doc | Notes |
|--------|-----|-------|

---

## Canonical terminology

| Chinese | English | Context |
|---------|---------|---------|
| 基金 | Fund | Tab name / product category |
| 涨跌幅 | Change % | Gain/loss percentage |
| 夏普比率 | Sharpe ratio | Risk-adjusted return metric |
| 最大回撤 | Max drawdown | Worst peak-to-trough decline |
| 净值 | NAV (Net Asset Value) | Fund unit price |
| 同类平均 | Category average | Peer-fund benchmark |
| 同类排行 | Category rank | Peer-fund ranking |
| 定投 | Recurring investment (DCA) | Dollar-cost-averaging purchase |
| 买一笔 | One-time buy | Single-purchase CTA |
| 持仓 | Holdings | Portfolio composition |
| 基金经理 | Fund manager | |
| 基金公司 | Fund company | e.g. 易方达基金管理有限公司 |
| 交易规则 | Trading rules | Purchase/redemption timing |
| 大数据选基 | Data-driven fund picks | Algorithmic recommendation section |

---

## Figma component library

Frames are 750px (@2x) — 所有 CSS 数值已按 1x（375 宽）转换，不要重新乘 2。

---

## Quick reference

```
Theme(次级交互): #456CE6 | CTA主色: #F99C4B
Gain(涨): #F24C3D | Loss(跌): #12B38A
Text: #37456E(一级) / #9DA2B3(二级) / #DFE0E6(提示)
Bg: #F5F5F5(默认) | 部分列表/榜单页整屏 #FFFFFF
Header blue(详情/排行 navbar): #3D60CC
Divider: #F0F0F0 | Surface: #FFFFFF
Font: var(--wb-app-font-family)
Card radius: 12px | Button/tag radius: 8px | Page padding: 12px
Page: 375px width | iOS platform (no WeChat capsule, no home indicator)
```

Values are restated here for convenience only — `profile/design-system/tokens.css` is the single source of truth.
