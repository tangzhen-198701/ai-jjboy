# 项目协作约定

## 项目和授权

这是独立抖音 AI 角色项目。产品决策见 [实施方案](./实施方案.md)。第一版优先内容创作和自有作品评论，预算 500 元/月，本机开发。人格参考猪猪侠的热血、幽默和担当，公开名称与形象待定。排除敏感政治和黄赌毒。

视频须确认具体内容版本后发布；低风险评论在官方权限具备、策略和验收通过后可自动回复。当前已有人格编辑、本地模拟聊天和手动记忆管理，使用单进程 JSON 文件持久化；没有真实模型、平台、队列或 SQLite 接入。不要把模拟输出或构建通过描述成真实发布成功。

## 架构

- `apps/admin`：React 管理台。
- `apps/server`：HTTP 服务及后续授权入口。
- `apps/worker`：异步任务入口，目前不执行任务。
- `packages/shared`：共享类型和策略，不依赖应用。
- `packages/agent`：人格、记忆与决策，不直接操作平台。
- `packages/adapters`：模型和平台接口隔离，当前只有模拟文本适配器。
- `.agents/skills`：仓库可复用操作流程；具体工具可用性以当前环境为准。
- `mcp`：MCP 配置模板和接入说明，不保存密钥。

应用可依赖 packages，packages 不反向依赖 apps。跨包使用 `@ai-douyin/*` 和 `workspace:*`，不跨目录相对导入源码。当前包导出 TypeScript 源码，通过 tsx/Vite 运行；dist 是编译检查产物，不承诺可直接由 node 启动。

## 技术和命名

使用 pnpm workspace；业务、脚本和 ESLint 配置均使用 TypeScript。文件和目录默认 kebab-case；组件文件也用 kebab-case，组件导出用 PascalCase。变量和函数 camelCase，类型和接口 PascalCase，常量可用 UPPER_CASE；不使用 I 前缀接口或无意义缩写。外部协议字段仅在适配边界保留原始命名。

`AGENTS.md`、`README.md`、`SKILL.md` 和现有 `实施方案.md` 是文件名例外。新增例外须在命名检查中明确说明。cspell 检查英文标识符和文本，不验证中文语义；不要将拼写错误加入词典，只有确认的领域词才能加入 `config/project-words.txt`。不可批量屏蔽源码以通过检查。

## 开发检查

运行 `pnpm install`，随后 `pnpm check`。检查包含文件命名、ESLint、cspell、TypeScript、集成测试和构建。依赖安装生成的 lockfile 应提交；CI 使用 frozen lockfile。新增真实业务逻辑时按行为风险补充测试，不为目录占位写镜像测试。

密钥只使用环境变量或本地忽略配置，不能写入日志、文档或示例。不得默默添加付费调用、公开网络服务或账号外发动作。遵守用户已经确认的执行授权，skill 本身不扩大权限。
