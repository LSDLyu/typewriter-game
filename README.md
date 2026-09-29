# 纸上电报局 · Typewriter Game

以 1950 年代便携式机械打字机为灵感的家庭英语打字游戏。五关依次练习字母、空格、句子与双色色带；每行准确打完后，拉动回车杆继续。桌面键盘和手机屏幕键帽都可操作。

- 正式路径：<https://edu.alading.org/games/typewriter/>
- 独立试玩：<https://lsdlyu.github.io/typewriter-game/>
- 纯前端，无后端、追踪脚本或外部字体请求。通关和设置仅存于当前浏览器。

## 玩法

按任务栏给出的文字依次敲键。打错或用错色带时，该字会标记出来；按退格键修正。一行完全正确后，用实体键盘 `Enter`、屏幕按钮或机器左侧回车杆换行。通关后根据失误和修正次数获得分数与星级，并解锁下一关。

音效、震动和完成动画可以分别关闭。不支持震动的设备会禁用震动开关；系统要求减少动态效果时会停用动画。声音使用浏览器内置 Web Audio 合成，不下载音频文件。

## 本地运行

在仓库目录执行 `python3 -m http.server 4173 --directory public`，访问 <http://localhost:4173/>。测试使用 `node --test tests/*.test.mjs`。

## 部署

线上 `/games/` 目录由现有 `lisa-games-router` Worker 生成。`integration/router-extension.js` 是追加到该 Worker 源码末尾的接入代码：为目录增加第三张卡片，并把 `/games/typewriter/` 及其静态资源转发到本仓库的 GitHub Pages。修改目录时须保留数学路径怪探和 Lisa 的现有路由并验证三个入口。

`worker.mjs` 和 `wrangler.jsonc` 提供独立 Cloudflare 静态资源部署方案，只匹配 `/games/typewriter` 和其子路径，绝不接管 `/games/` 目录。若使用独立 Worker，还需在目录 Worker 中加入卡片入口。

GitHub Pages 工作流只发布 `public/` 下的静态文件。正式站点当前通过已有的目录 Worker 转发此预览地址。
