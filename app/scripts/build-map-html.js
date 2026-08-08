#!/usr/bin/env node
/**
 * 生成自包含地图 HTML：把 Leaflet 的 CSS/JS 内嵌进 template.html → index.html
 * 用法: node scripts/build-map-html.js
 * 产物: src/map-web/index.html（供 react-native-webview source={require(...)} 使用）
 * 内嵌原因：不走 CDN（国内不稳），WebView 单文件加载最稳。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const leafletDist = path.join(root, 'node_modules', 'leaflet', 'dist');
const template = path.join(root, 'src', 'map-web', 'template.html');
const out = path.join(root, 'src', 'map-web', 'index.html');
// Android 原生 assets 副本（WebView 用 file:///android_asset/ 加载，绕开 RN 0.86 资源 URL 问题）
const androidAssets = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'bianxiaoer-map.html');

const css = fs.readFileSync(path.join(leafletDist, 'leaflet.css'), 'utf8');
const js = fs.readFileSync(path.join(leafletDist, 'leaflet.js'), 'utf8');

let html = fs.readFileSync(template, 'utf8');
html = html.replace('/*__LEAFLET_CSS__*/', css);
html = html.replace('/*__LEAFLET_JS__*/', js);

fs.writeFileSync(out, html);
fs.mkdirSync(path.dirname(androidAssets), { recursive: true });
fs.writeFileSync(androidAssets, html);
console.log(`✓ index.html 生成: ${(fs.statSync(out).size / 1024).toFixed(1)} KB (${out})`);
console.log(`✓ Android assets 副本: ${(fs.statSync(androidAssets).size / 1024).toFixed(1)} KB (${androidAssets})`);
