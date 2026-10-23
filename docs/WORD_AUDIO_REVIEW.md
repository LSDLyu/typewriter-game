# 单词声音检查（2026-10-23，草稿）

正式站点 `https://edu.alading.org/games/typewriter/game.mjs` 与本次修改前 main 完全一致，3 个独立单词和 8 段完整短句使用 Iris 合成录音。素材清单未标记为已试听；这本身不能证明读错，但缺少发音复核记录。

本分支先把 CAT 接到既有 Wikimedia Commons 美式真人录音，作者 Dvortygirl，CC BY-SA 3.0。录音由 number-path-game 仓库中的同一份已署名 MP3 复用，不是本次新下载；文件字节未修改。任务区新增来源入口与中英文说明，列出原始页面、作者、许可和格式转换说明。朗读按钮沿用网站样式，至少 44 px 高。原有单路语音、静音与后台停止逻辑保留。

SUN、HELLO 仍待获取适合的真人录音。整句不使用零散词典片段拼接。不能把本分支称为全游戏发音替换已完成，也不应直接合并：main 自动发布 Pages，正式站点转发该版本。

云开发环境访问维基媒体被域名白名单拦截。已保存新增 en.wiktionary.org、commons.wikimedia.org、upload.wikimedia.org 的配置草稿，需在环境设置保存并发布开发环境后重新确认访问。此动作与网站发布不同。

验证：10 项 Node 测试通过；28 个 MP3 解码通过；桌面、手机、iPad 尺寸的 Chromium 原生 CAT 播放与来源入口通过，无页面异常或横向溢出。检查没有模拟媒体播放；不代表真实 iPad Safari 扬声器或人工发音试听通过。完整扫描及 11 组离线对比页记录在相关 number-path-game 草稿中。
