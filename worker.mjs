const GAME_PATH = "/games/typewriter";
const ASSET_PATHS = new Set(["/index.html", "/style.css", "/game.mjs", "/logic.mjs"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    if (url.pathname === GAME_PATH) {
      return Response.redirect(`${url.origin}${GAME_PATH}/${url.search}`, 308);
    }
    if (!url.pathname.startsWith(`${GAME_PATH}/`)) {
      return new Response("Not found", { status: 404 });
    }
    const suffix = url.pathname.slice(GAME_PATH.length);
    const assetPath = suffix === "/" ? "/index.html" : suffix;
    if (!ASSET_PATHS.has(assetPath)) {
      return new Response("Not found", { status: 404 });
    }
    return env.ASSETS.fetch(new Request(new URL(assetPath, url.origin), request));
  },
};
