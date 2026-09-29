# 纸上电报局 · Typewriter Game

以 1950 年代便携式机械打字机为灵感的家庭英语打字游戏。五关依次练习字母、空格、句子与双色色带；每行准确打完后，拉动回车杆继续。桌面键盘和手机屏幕键帽都可操作。

- 正式路径：<https://edu.alading.org/games/typewriter/>
- 独立预览：<https://lsdlyu.github.io/typewriter-game/>（需启用 GitHub Pages 的 GitHub Actions 来源）
- 纯前端，无后端、追踪脚本或外部字体请求。通关和设置仅存于当前浏览器。

## 玩法

按任务栏给出的文字依次敲键。打错或用错色带时，该字会标记出来；按退格键修正。一行完全正确后，用实体键盘 `Enter`、屏幕按钮或机器左侧回车杆换行。通关后根据失误和修正次数获得分数与星级，并解锁下一关。

音效、震动和完成动画可以分别关闭。不支持震动的设备会禁用震动开关；系统要求减少动态效果时会停用动画。声音使用浏览器内置 Web Audio 合成，不下载音频文件。

## 本地运行

在仓库目录执行 `python3 -m http.server 4173 --directory public`，访问 <http://localhost:4173/>。测试使用 `node --test tests/*.test.mjs`。

## 部署

`wrangler.jsonc` 把游戏放在 `/games/typewriter/`，并在 `/games/` 的现有目录页面追加第三张游戏卡片。目录请求继续交给原有的自得学园 Worker 生成；本 Worker 只插入新入口，不改动数学路径怪探或 Lisa 的游戏路径。发布前需确认 Cloudflare 授权、站点路由和原目录仍可访问。

GitHub Pages 工作流只发布 `public/` 下的静态文件。正式站点通过 Cloudflare Worker 路由服务，部署方式为 `npm install && npm run deploy`。
