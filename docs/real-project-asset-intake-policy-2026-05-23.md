# Real-Project Asset Intake Policy - 2026-05-23

状态：SFC-R2 接收判断已回填，待总控验收
执行窗口：AlembicTest
范围：只判断 AlembicPlugin real-project collection / benchmark assets 的接收口径，不迁移、不删除、不运行真实项目

## 结论

AlembicTest 可以接收 AlembicPlugin 中测试性质的 real-project collection / benchmark assets，但只接收“真实项目测试编排和脱敏证据”这一类资产，不接收 Plugin 产品 runtime、Codex MCP、release / channel verification、schema verification 或单元测试必需 fixture。

本轮不直接迁移 AlembicPlugin 文件。AlembicPlugin 后续若要删除或迁移 real-project assets，应先按下面的目标路径和脱敏规则提交迁移包，再由 AlembicTest 验收。

## 扫描证据

只读扫描命中以下 AlembicPlugin 文件：

- `AlembicPlugin/scripts/collect-test-project-stats.mts`
- `AlembicPlugin/scripts/bench-real-projects.mts`
- `AlembicPlugin/test/fixtures/real-project-stats.json`
- `AlembicPlugin/test/fixtures/real-project-bench.json`

观察到的边界事实：

- 两个脚本都使用固定真实项目列表，并假设项目目录位于 AlembicPlugin 的 sibling directory。
- `collect-test-project-stats.mts` 会写入 `test/fixtures/real-project-stats.json`。
- `bench-real-projects.mts` 会写入 `test/fixtures/real-project-bench.json`。
- `real-project-stats.json` 当前包含 `/tmp/test-projects/<project>` 形式的绝对路径样本。
- 这些资产更像真实项目采集 / benchmark evidence，不是 Codex MCP runtime 或 release artifact 的产品实现。

## 接收路径

如果总控决定迁移，目标路径建议如下：

- 采集 / benchmark 脚本：`AlembicTest/scripts/plugin-real-project/`
- 脱敏 fixture：`AlembicTest/fixtures/plugin-real-project/`
- 本地 raw 输出：`AlembicTest/tmp/plugin-real-project/`
- 长期结论报告：`AlembicTest/docs/`

迁移后脚本应从 workspace root 运行，或自行解析 workspace root；不得依赖“真实项目一定是 AlembicPlugin sibling directory”的假设。

## 脱敏规则

迁移或接收前必须满足：

- 项目根通过 `--projects-root`、环境变量或 AlembicTest config 传入，不把本机绝对路径写入长期 fixture。
- 长期 fixture 中的项目路径使用 `<test-projects-root>/<project>`、相对路径或项目名，不保存 `/Users/...`、`/tmp/test-projects/...` 等机器态路径。
- 不保存 API key、token、cookie、登录态、device id、daemon runtime state 或私有日志原文。
- raw JSON、长日志和运行态 payload 只写入 `AlembicTest/tmp/`，并用 `npm --prefix AlembicTest run tmp:retention -- --max-age-days 0` 做 dry-run retention audit。
- 长期报告只保留脱敏摘要、验证命令、结果分类、提交 hash 和后续建议。

## 不接收范围

AlembicTest 不接收以下内容：

- AlembicPlugin Codex MCP server、Skill、channel、cache、runtime artifact 或 host adapter 实现。
- AlembicPlugin release / channel / marketplace verification 必需脚本。
- Plugin 单元测试或 runtime schema 加载仍直接消费的 fixture。
- 任何需要为了测试通过而修改 BiliDili 或其它真实项目源码的资产。

## 建议给 AlembicPlugin 的下一步

AlembicPlugin 可先做消费方扫描：

```bash
rg -n "collect-test-project-stats|bench-real-projects|real-project-stats|real-project-bench" AlembicPlugin
```

如果这些资产没有 Plugin 产品验证消费方，可在后续迁移包中移动到 AlembicTest 的接收路径，并按本文件脱敏。若它们仍被 Plugin 测试消费，应先把测试消费关系改成读取迁移后的脱敏 fixture，或在 Plugin 内保留最小产品测试 fixture，并把真实项目采集脚本迁出。

## 本轮未做

- 未修改 AlembicPlugin。
- 未运行 real-project collection / benchmark。
- 未操作 BiliDili。
- 未删除 AlembicTest `tmp/` raw evidence。
