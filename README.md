# 纸上电报局 · Typewriter Game

以 1950 年代便携式机械打字机为灵感的家庭英语打字游戏。五关依次练习字母、空格、句子与双色色带；每行准确打完后，拉动回车杆继续。桌面键盘和手机屏幕键帽都可操作。

- 中文正式路径：<https://edu.alading.org/games/typewriter>
- English: <https://edu.alading.org/en/games/typewriter>
- 独立试玩：<https://lsdlyu.github.io/typewriter-game/>（加 `?lang=en` 可预览英文）
- 纯前端，无后端、追踪脚本或外部字体请求。通关和设置仅存于当前浏览器。

## 玩法

按任务栏给出的文字依次敲键。打错或用错色带时，该字会标记出来；按退格键修正。一行完全正确后，用实体键盘 `Enter`、屏幕按钮或机器左侧回车杆换行。通关后根据失误和修正次数获得分数与星级，并解锁下一关。

音效、震动和完成动画可以分别关闭。不支持震动的设备会禁用震动开关；系统要求减少动态效果时会停用动画。按键与回车保留 Web Audio 机械音；CAT、SUN、HELLO 在当前候选分支使用 Wikimedia Commons 真人录音；完整句子、纠错和通关仍使用 Iris Bot MP3。

## 本地运行

在仓库目录执行 `python3 -m http.server 4173 --directory public`，访问 <http://localhost:4173/>。测试使用 `node --test tests/*.test.mjs`。

## 部署

线上中英文游戏目录由现有 `lisa-games-router` Worker 生成。`integration/router-extension.js` 是追加到该 Worker 当前源码末尾的接入代码：为两个目录增加第三张卡片，并把两个语言路径及其静态资源转发到本仓库的 GitHub Pages。它也直接提供 `/en/games`，避免站点的尾部斜杠规范化造成重定向循环。修改目录时须保留数学路径怪探和 Lisa 的现有路由并验证四个语言入口。

`worker.mjs` 和 `wrangler.jsonc` 提供独立 Cloudflare 静态资源部署方案，只匹配打字机游戏的中英文路径，绝不接管游戏目录。若使用独立 Worker，还需在目录 Worker 中加入卡片入口。

GitHub Pages 工作流只发布 `public/` 下的静态文件。正式站点当前通过已有的目录 Worker 转发此预览地址。

## Iris Bot 音频（2026-10-10）

接入用户提供的原始 MP3：中英文玩法/反馈语音和情境音效。页面载入不自动朗读；通过游戏操作或朗读按钮启动。声音设置可保存，关闭声音和切到后台会停止录音；快速重试不会堆叠语音。素材清单与原始脚本随资源保存。

## 单词真人录音（候选分支）

CAT、SUN、HELLO 已接入美式真人录音，任务区提供中英文来源页及逐项作者、许可。另 8 段完整短句保留连贯的 Iris 录音。来源页由 `node scripts/build-word-credits.mjs` 根据实际署名数据生成。见 [本次检查记录](docs/WORD_AUDIO_REVIEW.md)。本候选分支尚未合并或发布，main 更新会自动发布正式站点使用的 GitHub Pages。
