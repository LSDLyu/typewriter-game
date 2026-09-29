// Append this file to the existing lisa-games-router Worker source.
// It wraps the existing handler, so Number Path and Lisa keep their routes.
const typewriterBaseFetch = lisa_games_router_default.fetch;
const typewriterPath = "/games/typewriter";
const typewriterOrigin = "https://lsdlyu.github.io/typewriter-game";

lisa_games_router_default.fetch = async function (request) {
  const url = new URL(request.url);
  if (url.pathname === typewriterPath) {
    return new Response(null, { status: 308, headers: { Location: `${typewriterPath}/${url.search}` } });
  }
  if (url.pathname.startsWith(`${typewriterPath}/`)) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const upstreamUrl = new URL(typewriterOrigin + url.pathname.slice(typewriterPath.length));
    upstreamUrl.search = url.search;
    const upstream = await fetch(upstreamUrl, { method: request.method, redirect: "manual" });
    const headers = new Headers(upstream.headers);
    headers.delete("set-cookie");
    headers.set("X-Typewriter-Game-Source", "github-pages");
    headers.set("X-Content-Type-Options", "nosniff");
    const location = headers.get("location");
    if (location?.startsWith(typewriterOrigin)) {
      headers.set("location", location.replace(typewriterOrigin, typewriterPath));
    }
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
  }

  const response = await typewriterBaseFetch.call(this, request);
  if (request.method !== "GET" || !["/games/", "/en/games/"].includes(url.pathname) ||
      response.status !== 200 || !response.headers.get("content-type")?.includes("text/html")) {
    return response;
  }
  const html = await response.text();
  const english = url.pathname.startsWith("/en/");
  const card = english
    ? `<a class="card typewriter-card" href="/games/typewriter/"><div class="card-top" style="background:#d8ddd5"><span aria-hidden="true">03</span><span>ENGLISH · TYPEWRITER</span></div><div class="card-body"><p class="tag">5 missions · unlock in order</p><h2>Paper Telegraph Bureau</h2><p class="desc">Strike the keys, switch the ribbon, and pull the return lever. Chinese interface.</p><span class="button play">Start typing →</span></div></a>`
    : `<a class="card typewriter-card" href="/games/typewriter/"><div class="card-top" style="background:#d8ddd5"><span aria-hidden="true">03</span><span>英语 · 机械打字</span></div><div class="card-body"><p class="tag">五个任务 · 逐关解锁</p><h2>纸上电报局</h2><p class="desc">敲下字母，让字锤在纸上留下墨迹；换色带、拉回车杆，完成一封小小电报。</p><span class="button play">开始打字 →</span></div></a>`;
  const updated = html.includes(`href="${typewriterPath}/"`)
    ? html : html.replace("    </section>", `${card}\n    </section>`);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers });
};
