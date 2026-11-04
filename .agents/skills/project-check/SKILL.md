---
name: project-check
description: Run and diagnose the ai-douyin repository naming, lint, spelling, type and build checks after project changes.
---

# 工程检查

在仓库根目录执行 `pnpm check`。若尚未安装依赖，先执行 `pnpm install`；CI 和已同步的 lockfile 使用 `pnpm install --frozen-lockfile`。

按输出定位失败项，必要时只重跑失败的子命令。命名要求见根目录 `AGENTS.md`。cspell 报错先判断是拼写错误还是领域词，前者修改源码，后者才加入 `config/project-words.txt`。

不要通过禁用规则、扩大忽略目录、删除 lockfile 或清空代码来消除失败。记录实际运行的命令与结果；缺网络或依赖时明确未完成验证，不声称通过。此流程不包含发布、购买服务或账号操作。
