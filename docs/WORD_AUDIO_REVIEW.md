# 单词声音检查（2026-10-23，待发布）

CAT、SUN、HELLO 已全部改用 Wikimedia Commons 的真人美式英语录音。CAT、SUN 为 Dvortygirl 的 CC BY-SA 3.0 录音；HELLO 为同一作者的 PD-self 公有领域录音。任务区提供来源入口，中英文页面保留作者、原始文件页面、许可/公有领域状态和转换说明。重听按钮沿用网站样式，至少 44 px 高。

原始 Ogg 与 Commons 提供的 SHA-1 一致，再转为单声道 MP3 并施加固定音量增益；不剪切、不变速、不变调。署名记录包含来源修订号、原始媒体和 MP3 哈希、增益值、解码后的时长与电平。CAT/SUN 与 Lisa 使用相同 MP3 字节。其他 8 段完整短句和提示语保留连贯的 Iris 录音。

网络白名单已配置并实际通过 HTTP 200 检查；原先缺少 SUN、HELLO 的阻塞已解决。关联 Lisa 草稿和八款游戏的声音盘点：<https://github.com/LSDLyu/number-path-game/pull/2>。

验证：10 项 Node 测试通过，覆盖 11 个目标映射、3 个真人单词的文件与哈希、中英 Worker 路由。浏览器使用原生媒体和真实按钮操作核查 CAT、换行后的 SUN、切换关卡后的 HELLO，以及桌面、手机、iPad 尺寸的来源入口与布局；不模拟成功播放。

录音未标记为经人工逐词试听认可；53 组离线对比页可用于试听。视口模拟也不代表真实 iPad Safari 扬声器验证。保留 `pronunciation_listened: false`。

尚未合并或发布。main 自动发布 Pages，正式站点转发该版本；本次没有更改 Cloudflare 配置。
