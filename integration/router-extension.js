// Append to the current lisa-games-router Worker source. Existing routes stay intact.
const oldTypewriterFetch = lisa_games_router_default.fetch;
lisa_games_router_default.fetch = async function(request) {
  const url = new URL(request.url);
  const path = "/games/typewriter";
  if (url.pathname === path) return Response.redirect(url.origin + path + "/" + url.search, 308);
  if (url.pathname.startsWith(path + "/")) {
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", {status:405});
    const target = new URL("https://lsdlyu.github.io/typewriter-game" + url.pathname.slice(path.length) + url.search);
    const upstream = await fetch(target, {method:request.method, redirect:"manual"});
    const headers = new Headers(upstream.headers);
    headers.delete("set-cookie");
    headers.set("X-Typewriter-Game-Source", "github-pages");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(upstream.body, {status:upstream.status, statusText:upstream.statusText, headers});
  }
  const response = await oldTypewriterFetch.call(this, request);
  if (request.method !== "GET" || (url.pathname !== "/games/" && url.pathname !== "/en/games/") || response.status !== 200) return response;
  const html = await response.text();
  const card = url.pathname === "/en/games/" ?
    '<a class="card typewriter-card" href="/games/typewriter/"><div class="card-top" style="background:#d8ddd5"><span>03</span><span>ENGLISH · TYPEWRITER</span></div><div class="card-body"><p class="tag">5 missions · unlock in order</p><h2>Paper Telegraph Bureau</h2><p class="desc">Strike the keys, switch the ribbon, and pull the return lever. Chinese interface.</p><span class="button play">Start typing →</span></div></a>' :
    '<a class="card typewriter-card" href="/games/typewriter/"><div class="card-top" style="background:#d8ddd5"><span>03</span><span>英语 · 机械打字</span></div><div class="card-body"><p class="tag">五个任务 · 逐关解锁</p><h2>纸上电报局</h2><p class="desc">敲下字母，让字锤在纸上留下墨迹；换色带、拉回车杆，完成一封小小电报。</p><span class="button play">开始打字 →</span></div></a>';
  const headers = new Headers(response.headers);
  headers.delete("content-length"); headers.delete("content-encoding"); headers.delete("etag");
  return new Response(html.replace("    </section>", card + "\n    </section>"), {status:response.status, statusText:response.statusText, headers});
};
