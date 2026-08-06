# 插件开发说明

## Changelog 与版本

插件以仓库根目录的 `package.json` 为唯一版本来源，`.codex-plugin/plugin.json` 会在版本更新时自动同步。`skills/brainstorm/package.json` 只保留该 Skill 的维护命令，不单独维护版本。

每个会影响用户的改动都要在仓库根目录添加 changeset：

```bash
npm run changeset
```

选择 `patch`、`minor` 或 `major`，并填写可直接进入 changelog 的变更说明。提交命令生成的 `.changeset/*.md` 文件。

准备新版本时，在仓库根目录运行：

```bash
npm run version-packages
```

该命令会消费未发布的 changeset，更新根 `package.json` 与 `CHANGELOG.md`，并将相同版本写入 `.codex-plugin/plugin.json`。检查版本是否一致：

```bash
npm run check:version
```

## $Brainstorm

### 目录结构

分三层。只有第一层是跟产品绑定的。

**产品档案** —— 内置默认档案在 `profile/`；用户可通过 `setup-profile` 在项目根目录创建 `wb-design-profile/`

- `PROFILE.md`：模板表、路由表、产品铁律、设计语言、passes、可选 Branches 表与速查表。Step 3 会读它；文件头部的 frontmatter 是脚本读的配置（产品、平台、page class）。
- `branches/`：产品专属的后续分支文档（可选）；只需在 `PROFILE.md` 的 Branches 表中声明，不用修改 `SKILL.md`。
- `screens/`：生产页面模板（Ground Truth，直接决定输出质量）。
- `design-system/`：唯一 token 来源、组件样式和图标。
- `knowledge/`：产品知识桥接说明与只读快照（可选）。
- `quality/`：产品 QA 规则、passes、确定性工具和基准数据（可选）。
- `prototype/`：Prototype 分支使用的产品实现模板（`app.wxss` 的 token 段是**生成**的，别手改）。

**平台包 `platforms/`** —— 同平台的产品共用

- `wechat/`：微信预览外壳、小程序工具链与 Prototype 分支。
- `ios/`：iOS 预览外壳。
- 每个包就是一个 `chrome.html`（一段样式 + 导航结构，预览服务自动展开），要贡献分支就再放一个 `branches/` 目录。

**通用机制** —— 不认识任何产品和平台

- `SKILL.md`：主流程（选择工作区或内置档案 → 澄清 → 多方案 → 精简 → 质检 → 定稿 → 分支）。
- `assets/`：规范页面壳 `page-template.html`，以及由预览服务自动链接的展示样式 `frame.css`、热更新和批注资源。
- `references/`：方案发散方法与共享 Push to Figma 分支；通用 Simplify pass 已内联在 `SKILL.md`。
- `scripts/serve-preview.cjs`、`assets/live-reload.js`、`assets/annotate.js`：本地热更新预览服务，以及浏览器端 SSE 与点选批注客户端。
- `scripts/run-qa-gate.mjs`：通用质量检查（产品规则由 `profile/quality/rules.mjs` 提供）。
- `quality-benchmark/`、`scripts/`、`package.json`：质量基准、维护命令与自测。

### 开发与测试 Skill

#### 修改后

`quality-benchmark/` 用来评估 `brainstorm` 的真实产出质量，不是日常使用流程的一部分。适合在修改 `SKILL.md`、生产模板、设计资产、pass/分支流程或 `scripts/run-qa-gate.mjs` 后运行，用于比较改动前后的 gate 数字和截图表现；只改普通说明文档时通常不需要。

使用方式见 `quality-benchmark/README.md`。最小报告命令：

```bash
npm run benchmark:report -- profile/quality/benchmark/runs/<version>
```

与 baseline 对比：

```bash
npm run benchmark:report -- profile/quality/benchmark/runs/<new> --compare profile/quality/benchmark/runs/baseline
```

仓库根目录的自测命令：

```bash
npm test
```

这一个命令会依次检查发布结构、QA gate、会话遥测、点选批注、小程序 token 同步和质量基准报告。

每次本地 brainstorm 会话都会在返回的 `stateDir` 下写入 `session-events.jsonl`，记录服务启动、`solutions.html` 写入与改版、自动 QA gate 结果和页面读取时间。它不会自动记录 Simplify、产品 pass 或截图人工确认的完成时间。需要定位慢点时运行：

```bash
npm run session:report -- /path/to/session/state
```

#### 发布前

上传或分发前，在仓库根目录运行：

```bash
npm run validate
```

脚本会进行以下检查：

- 根目录存在 `SKILL.md`。
- 目录内没有 `.git/`、`node_modules/`、`.env`、`__pycache__/`、`.DS_Store`。
- `SKILL.md`、产品档案文档、共享引用和各层分支文档中只引用本目录内文件。
- 目录体积小于 100MB。

### 管理工作区产品档案

日常使用不要修改已安装插件中的 `profile/`。运行 `$setup-profile` 将内置档案复制到当前项目的固定目录 `./wb-design-profile`；目录存在时 `brainstorm` 会优先选择它，即使它不完整，并把缺失项作为任务级诊断。只有当前任务无法继续时，才由用户选择本次改用内置档案或先补齐工作区档案。插件更新不会覆盖这个工作区目录。

要根据 Figma URL、截图、现有 HTML 或其他设计来源增加页面模板，同样使用 `$setup-profile`。如果工作区档案尚不存在，它会先复制；随后添加模板、所需静态资源，并同步更新工作区 `PROFILE.md` 的模板清单与路由。

### 维护内置默认档案

**重写 `profile/` 目录就行**，你可以选择 AI 辅助或人工重写：

#### AI 辅助完整适配

Prompt：

```text
请读取 `@references/setup-profile.md`，然后开始建立新的产品档案。
```

#### 人工适配

详细说明见 `profile/README.md`。按重要性排序，前两项决定输出质量：

1. `profile/screens/` —— 换成你产品的生产界面模板。模型是「照着模板改」而不是「凭空生成」，这批模板直接决定输出质量。
2. `profile/design-system/tokens.css` —— 换成你的色板、字体、间距。这是唯一的 token 来源。
3. `profile/PROFILE.md` —— 重写模板表、路由表、产品铁律、设计语言；frontmatter 改成你的 `product`、`platform`、`pageClass`、`tokenPrefix`。
4. 如需产品专属的定稿后流程，把文档放在 `profile/branches/`，并在 `PROFILE.md` 的 Branches 表中按展示顺序声明。没有就让表保持空白，不需要凑一个分支。
5. 其余（`design-system/components.css`、`quality/`、`knowledge/`、Prototype 实现模板）都可以边用边补，不需要的可选部分可以删除。

改完跑 `npm run validate && npm test`。

### 几个要点

- **`SKILL.md` 不用改。** 它只写方法，通过 `profile/PROFILE.md` 读取当前产品；产品名和平台事实不要写进共享方法。
- **增删产品分支也不用改 `SKILL.md`。** `PROFILE.md` 的 Branches 表是唯一入口；表格顺序就是 Step 6 的展示顺序。
- **不用动 `scripts/run-qa-gate.mjs`。** 它只跑通用检查；产品规则在 `profile/quality/rules.mjs` 里，是可选的。删掉这个文件，新产品的界面照样过检 —— 不会被上一个产品的规则拦下来。
- **class 前缀是 profile 自己的。** 选一个产品内一致的前缀即可；通用机制不依赖具体前缀。
- **不是微信？** 把 `PROFILE.md` frontmatter 里的 `platform` 改成 `ios`，预览外壳就跟着换，12 个页面模板一行都不用改。
- **提供纯净的参考模板**：不要喂给大模型随意拼凑的页面。尽量从真实环境或 Figma Dev Mode 中提取结构完整、且使用全局 CSS class 的 HTML。
- **避免硬编码样式**：模型会模仿模板的写法。模板里如果全是内联 `<style>` 和硬编码颜色，生成的代码也会一样混乱 —— 尽量抽到 `profile/design-system/tokens.css`。
