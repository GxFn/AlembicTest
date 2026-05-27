# AlembicTest Agent Instructions

<!-- codex-control-workspace:scope:start -->
## Workspace 接入卡

本节由 control workspace 安装脚本维护，只记录本窗口接入坐标和自动化最小门禁。硬规则以父级 AGENTS 与本文件的“本窗口最高停止卡”为准；不要在这里重复仓库专属规则。

### 坐标

- Control workspace: `../codex-control-workspace`
- Window name: `AlembicTest`
- Parent workspace AGENTS: `../AGENTS.md`
- Active workspace index: `../codex-control-workspace/.workspace-active/workspace/index.md`
- Active workspace status: `../codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`
- Current plan directory: `../codex-control-workspace/.workspace-active/workspace/current`
- Window ledger: `../workspace-ledger/AlembicTest`
- Test exchange: `../codex-control-workspace/.workspace-active/workspace/current/test-exchange.md`

### 领取 workspace 任务时

1. 先读本文件。
2. 再读父级 `../AGENTS.md`。
3. 再读 `../codex-control-workspace/.workspace-active/workspace/index.md` 和 `../codex-control-workspace/.workspace-active/workspace/current/workspace-current-status.md`。
4. 如果有当前计划、任务包或 VAD heartbeat，只按 `../codex-control-workspace/.workspace-active/workspace/current` 中明确分配给 `AlembicTest` 的内容执行。

### VAD 最小门禁

- Automation 只是唤醒信封，不改变本窗口职责，也不扩大任务范围；具体任务仍以 claim 结果和当前计划为准。
- VAD 模式下只允许 claim / finish `AlembicTest` 对应任务；`claim --json` 没有返回本窗口任务时必须停止。
- 只有 finish JSON 同时明确允许下一跳时，才可创建下一条 heartbeat；否则停止并回报总控。
- 非 TestWindow 不得创建、处理或验证 TestWindow heartbeat，除非当前计划和 finish JSON 同时显式授权。
- Thread id 只能写入 control workspace 的本地 runtime；不得写入 tracked 文档、回填正文或 GitHub。

### 文档落点

- 长期跨仓库协作文档、计划、验收、扫描和边界记录写入 `../workspace-ledger/AlembicTest`；本仓库 `docs/` 只放随源码维护的产品、发布或用户文档。
<!-- codex-control-workspace:scope:end -->

## 本窗口最高停止卡

本目录是 AlembicWorkspace 内的测试验证窗口，不是 Alembic 产品源码仓库，也不是用户真实业务项目。以下规则是本窗口执行前停止卡；任何测试、自动化、脚本输出或总控回填与本节冲突时，先停止并回报总控。

### 先停下

- 如果当前任务没有明确分配给 `AlembicTest`，或没有用户口头要求 / 当前总控测试单 / 当前计划任务包说明真实验证目标，停止。
- 如果测试问题不需要真实项目、cold-start / rescan、Dashboard 手动观察、运行时监控、真实项目复现 / 回归或跨仓库集成环境证据，停止并回报总控由总控或源仓库自测。
- 如果我准备把测试验证窗口变成产品实现仓库、临时 demo 仓库、补丁仓库，或在本目录复制 Alembic 系列仓库 / 真实测试项目的产品实现来“方便测试”，停止。
- 如果测试发现产品问题，却准备直接在本目录修产品、绕过源仓库边界或把测试脚本当成产品修复，停止；只回填证据、复现和建议修复仓库。
- 如果计划涉及修改真实产品代码、清理用户项目、重建 Alembic 数据、取消后台任务、切换全局配置、删除缓存、提交代码或改变测试范围，但当前总控文档或用户没有明确授权，停止。
- 如果准备默认把 `BiliDili` 当作唯一测试项目，或没有按测试单选择 `AlembicWorkspace` / `BiliDili` / 其它目标，停止。
- 如果测试没有写清唯一问题、对象边界、入口、触发动作、真实数据、状态变化、消费方、成功结论、失败结论、不能推出的结论和停止条件，停止。
- 如果命令未运行、日志未读取、UI 未观察、报告不存在或证据无法复核，却准备写成通过、完成或失败事实，停止。
- 如果测试结论只来自自然语言判断、脚本表面状态或自己线程的自动化唤醒，而没有真实命令、API、日志、UI、截图、报告或文件证据，停止。
- 如果启动或使用 Dashboard、本地 Web UI、localhost 前端页面，却不准备在 Codex 右侧 in-app browser 打开最相关页面，停止。

### 正确顺序

1. 先确认测试单、真实验证目标、目标仓库 `AGENTS.md`、测试边界和不可推出的结论。
2. 再用目标仓库已有入口或总控指定命令运行真实验证，保留命令、日志、UI、API、报告或截图证据。
3. 再判断问题归属到哪个源仓库；本窗口只写复现、证据和建议。
4. 最后按总控要求回填完成范围、验证结果、遗留风险和下一步建议。

当前可作为 AlembicTest 真实验证目标的项目包括 `AlembicWorkspace` 和 `BiliDili`。两者都不是临时 demo：`AlembicWorkspace` 用于 Alembic 自身 multi-root / self-hosting 集成验证，`BiliDili` 用于真实 iOS/Swift 业务项目验证。每次测试必须以用户口头要求或当前总控测试单为准选择目标；不得默认把 BiliDili 当成唯一测试项目。

## 文档与证据存储

- 新建长期测试计划、复现记录、验收记录、监控记录、问题清单和验证报告时，优先写到 Workspace 接入卡中的 `Window ledger`，不要散落到 Alembic 产品仓库内部或旧 workspace `docs/` 根层级。
- 跨仓库总控计划、窗口分派、阶段状态和验收索引由 `../codex-control-workspace/.workspace-active/workspace/` 挂载；本窗口只执行其中分配给 `AlembicTest` 的测试验证任务。
- 如果当前总控文档明确要求把证据回填到某个 wave 文档，应按该文档指定位置回填，并同时在 `../workspace-ledger/AlembicTest/` 保存必要的长期验证材料。
- 本目录内只保留测试窗口自身的 `AGENTS.md`、临时可复用脚本、测试 fixtures、说明文件或总控明确授权的辅助资产；不要把跨仓库协作长期文档直接堆在本目录。
- 测试默认目标、等待时间、监控轮询、日志信号匹配等测试配置统一写到 `config/`；不要把这些配置散落到总控 `AGENTS.md` 或 workspace 根 `scripts/`。
- 测试执行归属、配置归属和回填要求以 `docs/testing-operation-policy.md` 为准。
- 长期文档不得写入用户本机绝对路径、API key、Cookie、token、登录态、设备 UDID 或其它私密信息。需要记录路径时，优先使用 workspace 相对路径或说明性占位。

## 窗口定位

- `AlembicTest` 是 AlembicWorkspace 的独立测试验证窗口，用来承接总控分配的复现、冒烟、回归、冷启动监控、跨仓库集成验证和证据整理。
- 本窗口不是 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicWorkspace` 或 `BiliDili` 的替代开发窗口。
- 本窗口可以读取相关仓库代码、运行验证命令、启动或观察测试所需服务，但不得把产品修复直接写在 `AlembicTest` 中。
- 如果验证任务需要修改源代码，应把问题、证据、建议修复仓库和最小复现路径回填给总控，由总控分派到对应产品窗口。
- 如果用户明确要求本窗口直接修复某个仓库，也必须先读取目标仓库自己的 `AGENTS.md`，并遵守该仓库边界；测试窗口身份不覆盖源仓库规则。

## 测试边界

- 可以做：复现步骤整理、命令封装、日志观察、API 状态检查、Dashboard 行为记录、冷启动/重建流程监控、跨仓库 smoke、测试数据说明和验证报告。
- 可以做：在总控授权下运行 Alembic CLI、daemon、Dashboard、Codex plugin、本地测试脚本和真实项目只读扫描。
- 不要做：在本目录实现 Alembic runtime、Agent runtime、Dashboard UI、Plugin MCP、Core API、AlembicWorkspace 总控功能或 BiliDili 产品功能。
- 不要做：为了让测试通过而改动真实业务项目结构、删除用户数据、隐藏失败日志、绕过 QualityGate、伪造候选或把未验证命令写成通过。
- 不要做：长期依赖本目录里的 mock 替代真实调用链。测试可以有 fixture，但最终结论必须回到真实入口、真实数据、真实状态变化和真实消费方。

## 验证与回填

- 先读取当前总控文档、目标仓库 `AGENTS.md`、相关脚本说明和真实入口，再执行测试。
- 只改本目录说明或测试文档时，通常不需要跑产品构建，但必须说明未运行构建的原因。
- 验证 Alembic 主仓库 CLI / daemon / Dashboard 时，优先使用 `Alembic` 仓库已有脚本和当前总控文档指定命令，不要临时发明另一套启动路径。
- 测试中只要启动或使用 Dashboard、本地 Web UI、localhost 前端页面，就必须同时在 Codex 右侧 in-app browser 打开对应页面，优先打开当前测试最相关的目标 URL（如 Jobs/Candidates/具体 job 页面），方便用户实时查看；不要只在报告或终端里写 URL。
- 验证 AlembicAgent 行为时，必须关注真实 LLM/tool 调用闭环、日志、取消、timeout、retry、fallback、QualityGate 和 memory / note_finding 证据。
- 验证 Dashboard 时，必须关注用户可见状态、轮询 API、任务状态分类、取消/失败/完成归类、按钮行为和错误展示。
- 验证 AlembicWorkspace 时，把它当 Alembic 自身真实 multi-root / self-hosting 测试项目保护；默认只按总控测试单做 ProjectScope、Plugin、Dashboard、daemon/API、source folder no-write 等最小复测，不提交 workspace 仓库，不把 workspace 根目录加入 source `folders[]`，不把总控文档治理和产品源码修复混在同一测试动作里。
- 验证 BiliDili 时，把它当真实 iOS/Swift 项目保护；默认只做只读扫描、冷启动验证或总控明确要求的最小回归，不要改业务代码。
- 如果命令无法运行，记录原因、环境限制和下一步建议，不能把未运行命令写成通过。

## 文件地图

- 本窗口规则：`AGENTS.md`。
- 测试配置：`config/`。
- 可复用测试脚本：`scripts/`。
- 测试 fixtures 或样例输入：`fixtures/`。
- 临时输出、日志截取和本地缓存：`tmp/`，默认不应进入 git。
- 长期测试计划、复现记录、验证报告：`../workspace-ledger/AlembicTest/`。
- 跨仓库当前计划、分派和验收入口：`../codex-control-workspace/.workspace-active/workspace/`。

推荐结构：

```text
AlembicTest/
├── AGENTS.md
├── config/
├── docs/
├── scripts/
├── fixtures/
└── tmp/
```

## 技术与脚本规则

- 本目录默认使用 Node.js / shell 脚本承接跨仓库验证；具体语言和工具以当前测试任务、目标仓库和既有脚本为准。
- 新增脚本应 repo-neutral、参数化、无密钥、无用户绝对路径、无网络强依赖；如果必须写绝对路径，只能写在本地临时配置或命令参数中，不进入长期文档。
- 必须尽量多地在代码旁补充简体中文说明，优先解释测试意图、链路边界、状态判断、分叉原因、降级原因、失败归类、日志依据和后续校验方式。
- 任何运行时分叉、fallback、降级、兼容转译、跳过、短路、重试、取消或错误归类，都必须打印足够明确的日志或诊断信息，日志要能看出触发条件、选择路径、关键输入、结果状态和后续校验依据。
- 脚本输出应适合总控快速判断：当前窗口、目标项目、入口 URL、job id、状态、进度、失败原因、关键日志信号、候选数量和下一步建议。
- 不要回退其他窗口或用户已有改动；如果工作区已有无关变更，只处理当前测试任务需要的文件。

## 长期维护规则

- 测试前先明确“验证什么闭环”：入口、触发动作、真实数据、状态变化、消费方、失败路径和完成标准。
- 测试结论必须基于真实命令、真实 API、真实日志、真实 UI 状态或真实文件证据；不要只凭推断判断通过。
- 如果发现链路没有闭环，优先记录断点位置、上游产物、下游消费方、缺失状态和复现方式，不要继续扩展无关分叉。
- 如果发现产品问题，回填到总控并指出应由哪个仓库修复；本窗口可以提供复现脚本和验证脚本，但不替代产品仓库实现。
- 任何删除、清理、重建、取消任务、关闭服务或切换配置都必须有用户或当前总控文档授权。
