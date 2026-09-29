const GAME_PATH = "/games/typewriter";

const CARD = `<a class="card typewriter" href="/games/typewriter/">
  <div class="card-top"><span aria-hidden="true">03</span><span>英语 · 机械打字</span></div>
  <div class="card-body">
    <p class="tag">五关纸上任务 · 逐关解锁</p>
    <h2>纸上电报局</h2>
    <p class="desc">敲字母、换色带、拉回车杆，亲手打出一封封小消息。</p>
    <span class="button play">开始打字 →</span>
  </div>
</a>`;

const DIRECTORY_STYLE = `<style>
  .card.typewriter .card-top { background: #a8bcb0; }
  .card.typewriter .tag { color: #115c52; }
</style>`;

const DIRECTORY_INTRO = "选一个游戏开始。想一想数字路线，和 Lisa 认识字母，或者用机械打字机写一封小电报；完成的进度会保存在当前浏览器。";

function isGamePath(pathname) {
  return pathname === GAME_PATH || pathname.startsWith(`${GAME_PATH}/`);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/games/") {
      const origin = await fetch(request);
      if (!origin.ok || !origin.headers.get("content-type")?.includes("text/html")) return origin;
      return new HTMLRewriter()
        .on("section.grid", { element(element) { element.append(CARD, { html: true }); } })
        .on("head", { element(element) { element.append(DIRECTORY_STYLE, { html: true }); } })
        .on("p.intro", { element(element) { element.setInnerContent(DIRECTORY_INTRO); } })
        .transform(origin);
    }
    if (isGamePath(url.pathname)) {
      const suffix = url.pathname.slice(GAME_PATH.length);
      const assetPath = suffix === "" || suffix === "/" ? "/index.html" : suffix;
      if (!["/index.html", "/style.css", "/game.mjs", "/logic.mjs"].includes(assetPath)) {
        return new Response("Not found", { status: 404 });
      }
      const assetUrl = new URL(assetPath, url.origin);
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }
    return fetch(request);
  },
};
