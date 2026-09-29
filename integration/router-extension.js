// Append to the current lisa-games-router Worker source. Keep its existing routes intact.
const previousTypewriterFetch = lisa_games_router_default.fetch;
const typewriterOrigin = "https://lsdlyu.github.io/typewriter-game";

lisa_games_router_default.fetch = async function(request) {
  const url = new URL(request.url);
  const english = url.pathname.startsWith("/en/");
  const gamePath = english ? "/en/games/typewriter" : "/games/typewriter";
  if (url.pathname === gamePath || url.pathname.startsWith(gamePath + "/")) {
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    const suffix = url.pathname.slice(gamePath.length);
    const documentRequest = suffix === "" || suffix === "/";
    const target = new URL(typewriterOrigin + (documentRequest ? "/" : suffix) + url.search);
    const upstream = await fetch(target, { method: request.method, redirect: "manual" });
    const headers = new Headers(upstream.headers);
    headers.delete("set-cookie");
    headers.set("X-Typewriter-Game-Source", "github-pages");
    headers.set("X-Content-Type-Options", "nosniff");
    if (documentRequest && upstream.ok && request.method === "GET") {
      const html = (await upstream.text()).replace("<head>", `<head><base href="${gamePath}/">`);
      headers.delete("content-length");
      headers.delete("content-encoding");
      headers.delete("etag");
      headers.set("Content-Language", english ? "en" : "zh-CN");
      return new Response(html, { status: upstream.status, statusText: upstream.statusText, headers });
    }
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
  }

  // The site's slash normalization can otherwise bounce /en/games and /en/games/ forever.
  const directoryLocale = url.pathname === "/en/games" || url.pathname === "/en/games/" ? "en" : url.pathname === "/games" || url.pathname === "/games/" ? "zh" : null;
  if (!directoryLocale) return previousTypewriterFetch.call(this, request);
  if (request.method !== "GET" && request.method !== "HEAD") return previousTypewriterFetch.call(this, request);
  const response = directoryLocale === "en" ? gamesDirectory("en") : await previousTypewriterFetch.call(this, request);
  if (response.status !== 200 || request.method === "HEAD") return response;
  const html = await response.text();
  if (html.includes('class="card typewriter-card"')) return new Response(html, response);
  const card = directoryLocale === "en" ?
    '<a class="card typewriter-card" href="/en/games/typewriter"><div class="card-top" style="background:#d8ddd5"><span>03</span><span>ENGLISH · TYPEWRITER</span></div><div class="card-body"><p class="tag">5 missions · unlock in order</p><h2>Paper Telegraph Bureau</h2><p class="desc">Strike the keys, switch the ribbon, and pull the return lever to type a message.</p><span class="button play">Start typing →</span></div></a>' :
    '<a class="card typewriter-card" href="/games/typewriter"><div class="card-top" style="background:#d8ddd5"><span>03</span><span>英语 · 机械打字</span></div><div class="card-body"><p class="tag">五个任务 · 逐关解锁</p><h2>纸上电报局</h2><p class="desc">敲下字母，让字锤在纸上留下墨迹；换色带、拉回车杆，完成一封小小电报。</p><span class="button play">开始打字 →</span></div></a>';
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("Cache-Control", "no-cache");
  return new Response(html.replace("    </section>", card + "\n    </section>"), { status: 200, headers });
};
