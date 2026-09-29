const GAME_PATHS = ["/games/typewriter", "/en/games/typewriter"];
const ASSET_PATHS = new Set(["/index.html", "/style.css", "/game.mjs", "/logic.mjs", "/locale.mjs"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const gamePath = GAME_PATHS.find((path) => url.pathname === path || url.pathname.startsWith(`${path}/`));
    if (!gamePath) {
      return new Response("Not found", { status: 404 });
    }
    const suffix = url.pathname.slice(gamePath.length);
    const assetPath = suffix === "" || suffix === "/" ? "/index.html" : suffix;
    if (!ASSET_PATHS.has(assetPath)) {
      return new Response("Not found", { status: 404 });
    }
    const response = await env.ASSETS.fetch(new Request(new URL(assetPath, url.origin), request));
    if (assetPath !== "/index.html" || request.method === "HEAD") return response;
    const html = (await response.text()).replace("<head>", `<head><base href="${gamePath}/">`);
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("Content-Language", gamePath.startsWith("/en/") ? "en" : "zh-CN");
    return new Response(html, { status: response.status, headers });
  },
};
