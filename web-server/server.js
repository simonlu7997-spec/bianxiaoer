#!/usr/bin/env node
/**
 * 边小二 Web 版静态服务器（零依赖）
 * 服务 app-v2/dist/（expo export --platform web 产物），SPA 路由回退 index.html
 * 数据 API 由浏览器直连 https://admin.pect-dapp.io（CORS 已全开）
 * 端口: 3201
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3201;
const DIST = path.join(__dirname, "..", "app-v2", "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);

  // 防止路径穿越
  const safe = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
  let filePath = path.join(DIST, safe);

  // 目录/根 → index.html
  if (filePath === DIST || fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const isAsset = /\.(js|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|map)$/.test(filePath);
    res.writeHead(200, {
      "Content-Type": type,
      // 带 hash 的静态资源可长缓存；index.html 不缓存（保证发版即时生效）
      "Cache-Control": isAsset && !filePath.endsWith("index.html")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // SPA 回退：非文件路由一律给 index.html（expo-router 客户端路由接管）
  const indexPath = path.join(DIST, "index.html");
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    fs.createReadStream(indexPath).pipe(res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[bianxiaoer-web] listening on http://127.0.0.1:${PORT} (dist=${DIST})`);
});
