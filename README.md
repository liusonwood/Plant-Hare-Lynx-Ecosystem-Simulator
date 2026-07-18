# 生态学教学演示：植物-雪兔-猞猁种群动态模型

基于 **Lotka-Volterra 三营养级模型** 的交互式网页应用，用于演示植物、雪兔（食草动物）和猞猁（食肉动物）种群的周期性波动。
该工具专为高中生物学教学（选择性必修2《生物与环境》）设计，支持实时扰动实验，直观展示生态系统的稳定性、恢复力及种群动态。

**v2 新增**：内置 **AI 助手**（右侧抽屉），可通过自然语言读取/设置种群数量、启停模拟；架构升级为**配置驱动的多物种多关系模型**，便于扩展不同生物关系。

## ✨ 特性

- **三营养级动态模拟**：植物（资源）、雪兔（初级消费者）、猞猁（次级消费者）相互耦合，呈现典型的时滞性周期振荡。
- **双Y轴图表**：植物密度（左轴 0 ~ 350）与动物密度（右轴 0 ~ 100）独立刻度，曲线清晰无重叠。
- **交互控制**：▶️ 开始模拟 / 🔄 重置模拟 / ⏸️ 暂停 / ▶️ 继续。
- **生态扰动实验**：一键减少任意种群 10%、30% 或 50%（不低于最小阈值），观察系统如何恢复并重新进入周期。
- **Eco-Tuner 参数调谐**：自由调节模型动力学参数与初始种群数量。
- **🤖 AI 助手**：右侧可折叠抽屉，用自然语言控制模拟器（读取种群、设置数量、启停/重置）。
- **🧬 配置驱动架构**：模型由 `EcoModelSpec`（物种 + 关系 + 参数）描述，未来加新模型/关系只需新增配置文件。
- 响应式布局，适配桌面（AI 抽屉为桌面端右侧常驻，不适配移动端）。

## 🖥️ 在线演示 / 使用方式

### 方式一：本地开发（纯前端，无 AI）

```bash
npm install
npm run dev      # 打开 http://localhost:5173
```

模拟器部分可独立运行；AI 助手需后端 Worker（见下）。

### 方式二：Cloudflare Workers 部署（含 AI 助手）

AI 助手通过 Cloudflare Worker 代理 OpenAI 兼容 API，前端整体 React 化。

```bash
npm install
npm run build            # 构建前端到 dist/

# 配置环境变量
cp .dev.vars.example .dev.vars   # 本地开发：填入 OPENAI_API_KEY 等
npx wrangler dev                 # 本地起 Worker + 静态资源

# 部署
npx wrangler secret put OPENAI_API_KEY   # 生产密钥
npx wrangler deploy
```

## 🔧 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `OPENAI_BASE_URL` | OpenAI 兼容 API base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | 模型名（需支持 tools/tool_choice） | `gpt-4o-mini` |
| `OPENAI_API_KEY` | API Key（secret，不入 wrangler.jsonc） | `sk-...` |

- `OPENAI_BASE_URL` 与 `OPENAI_MODEL` 在 `wrangler.jsonc` 的 `vars` 中配置。
- `OPENAI_API_KEY` 用 `wrangler secret put` 设置，本地放 `.dev.vars`（已 gitignore）。
- 兼容任意 OpenAI 兼容端点（官方 / 第三方网关 / Ollama 等），需端点支持 `tools` 与 `tool_choice`。

## 🤖 AI 助手与工具

AI 助手基于 **Cloudflare Agents SDK**（`AIChatAgent` + `useAgentChat`）实现。Worker 端声明 5 个工具的 schema（不提供 `execute`），实际执行在前端浏览器 `onToolCall` 中，直接操作模拟器实时状态，`autoContinueAfterToolResult` 自动续轮。

| 工具 | 作用 |
|------|------|
| `read-animal-data` | 读取当前物种列表、各物种数量、关系与运行状态。 |
| `animal-population-set` | 设置物种数量（部分更新，键为物种 id）。**调用前必须先 read。** |
| `start` | 启动 / 继续模拟。 |
| `pause` | 暂停模拟。 |
| `restart` | 重置模拟到初始状态。 |

**「必须先 Read」规则**：会话内调用 `animal-population-set` 前，必须先调用过一次 `read-animal-data`；该约束在会话级别生效（读过一次后可多次 set）。数值低于物种最小阈值会自动 clamp。物种 id 不写死，由当前模型的 spec 决定（`read` 会返回可用 id）。

试试对 AI 说：「读取当前种群，然后把雪兔设为 30，再暂停模拟」。

## 📐 模型核心方程

采用改进的 Lotka-Volterra 三物种模型（v2 由通用 `derivatives` 按 spec 动态生成，输出等价）：

| 种群 | 微分方程 | 变量说明 |
|------|----------|----------|
| 植物 (P) | `dP/dt = r·P·(1 - P/K) - a·P·H` | r：内禀增长率，K：环境容纳量，a：捕食率（植物->雪兔） |
| 雪兔 (H) | `dH/dt = e·a·P·H - d·H - b·H·L` | e：转化效率，d：雪兔死亡率，b：捕食率（雪兔->猞猁） |
| 猞猁 (L) | `dL/dt = f·b·H·L - m·L` | f：转化效率，m：猞猁死亡率 |

模拟采用 **欧拉法** 数值积分（步长 `dt = 0.045`），数据窗口保留最近 260 个时间点。

## ⚙️ 默认参数表

| 符号 | 含义 | 值 |
|------|------|------|
| r | 植物增长率 | 0.28 |
| K | 植物环境容纳量 | 280 |
| a | 雪兔对植物的摄食率 | 0.009 |
| e | 植物->雪兔转化效率 | 0.68 |
| d | 雪兔自然死亡率 | 0.22 |
| b | 猞猁对雪兔的捕食率 | 0.016 |
| f | 雪兔->猞猁转化效率 | 0.45 |
| m | 猞猁死亡率 | 0.10 |
| dt | 积分步长 | 0.045 |
| 初始植物 (P₀) | - | 150.0 |
| 初始雪兔 (H₀) | - | 42.0 |
| 初始猞猁 (L₀) | - | 8.0 |

> 所有种群均有最小阈值（植物 1.2，雪兔 0.5，猞猁 0.2）防止灭绝导致的数值不稳定。

## 🧬 模型扩展指南（新增生物关系）

架构设计为配置驱动，新增模型/关系**无需改动 derivatives、图表、AI 工具**：

1. **新增模型**：在 `src/eco/models/` 新增一个文件，导出 `EcoModelSpec`（定义 `species` / `relations` / `params` / `paramMeta` / `axisRanges`），在 `models/index.ts` 注册到 `MODELS`。顶部 `ModelSelector` 下拉会自动出现新选项。

2. **新增关系类型**：在 `types.ts` 的 `RelationType` 扩展枚举（如 `"competition" | "mutualism"`），在 `derivatives.ts` 加对应分支。v1 仅实现 `predation`。

3. **新增物种到现有模型**：编辑对应 spec 文件的 `species` 数组即可。AI 工具因使用动态 species 键（`z.record`），无需改动。

## 📂 文件结构

```
.
├── index.html                    # Vite 入口（引入 Chart.js / marked / DOMPurify CDN）
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.worker.json
├── vite.config.ts
├── wrangler.jsonc                # Cloudflare Workers 配置
├── .dev.vars.example             # 环境变量示例
├── src/
│   ├── main.tsx / App.tsx
│   ├── eco/
│   │   ├── types.ts              # SpeciesDef / RelationDef / EcoModelSpec
│   │   ├── derivatives.ts        # 按 spec 动态生成 dN/dt
│   │   ├── models/lotkaVolterra3.ts  # v1 默认模型 spec
│   │   ├── useEcoSimulation.ts   # 通用状态机 hook
│   │   └── useEcoChart.ts        # Chart.js hook（动态 dataset + 双 Y 轴）
│   ├── components/
│   │   ├── ChartPanel / CustomLegend / DisturbPanel / ModelSelector
│   │   ├── InfoModal / EcoTunerModal
│   │   └── ai/                   # AI 抽屉（AgentChatDrawer / MessageList / MessageInput / useEcoAgent）
│   ├── tools/ecoTools.ts         # 5 个工具执行器 + hasRead 约束
│   └── styles.css
├── worker/
│   ├── index.ts                  # routeAgentRequest + 静态资源 fallback
│   ├── EcoChatAgent.ts           # AIChatAgent + streamText + createOpenAI + 工具 schema
│   └── env.d.ts
├── chart.umd.min.js              # (旧版遗留，现已用 CDN)
└── *.png                         # 物种图标
```

## 📋 依赖

- [Chart.js](https://www.chartjs.org/) v4+ – 动态折线图（CDN）
- [marked](https://marked.js.org/) + [DOMPurify](https://github.com/cure53/DOMPurify) – AI 回复 markdown 渲染与净化（CDN）
- [React](https://react.dev/) 19 + [Vite](https://vitejs.dev/) 6 – 前端框架与构建
- [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/) (`agents` / `@cloudflare/ai-chat` / `ai` / `@ai-sdk/openai`) – AI Agent + OpenAI 兼容接入

---

项目基于普通高中教科书《生物学 选择性必修2 生物与环境》中"种群数量波动"相关内容设计。

**Enjoy exploring ecology!** 🌿🐇🐆
