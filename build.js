// Ghép các file Apps Script (src/*.html) thành dist/index.html cho Cloudflare
const fs = require('fs'), path = require('path');
const API_URL = process.env.GAS_API_URL || 'DAN_URL_WEB_APP_(KET_THUC_BANG_/exec)_VAO_DAY';
const SRC = path.join(__dirname, 'src'), nfc = s => s.normalize('NFC');
const files = {}; fs.readdirSync(SRC).forEach(f => files[nfc(f)] = f);
const read = n => files[nfc(n)] ? fs.readFileSync(path.join(SRC, files[nfc(n)]), 'utf8') : null;
const missing = [];
let html = read('Index.html');
if (!html) throw new Error('Thiếu src/Index.html');
html = html.replace(/<\?!=\s*include\('([^']+)'\);?\s*\?>/g, (_, n) => {
  const c = read(n + '.html'); if (c === null) missing.push(n); return c || '';
});
html = html
  .replace(/"<\?=\s*pageParam\s*\?>"/g, () => '(new URLSearchParams(location.search).get("page")||"")')
  .replace(/"<\?=\s*lopParam\s*\?>"/g, () => '(new URLSearchParams(location.search).get("lop")||"")')
  .replace(/value="admin@edu\.vn"/g, () => 'value=""')      // bỏ tài khoản điền sẵn
  .replace(/value="admin123"/g, () => 'value=""')
  .replace(/tabId === 'positive_discipline_2627'/g, () => "id === 'positive_discipline_2627'"); // lỗi biến tabId
const shim = '<script>window.GAS_API_URL=' + JSON.stringify(API_URL) + ';</script>\n<script>' + read('gas-shim.js') + '</script>\n';
html = html.replace('<head>', () => '<head>' + shim);
const i = html.lastIndexOf('</body>');
html = html.slice(0, i) + read('CrudModules.html') + html.slice(i);
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), html);
console.log('Build xong. File chưa có (bỏ qua): ' + (missing.join(', ') || 'không'));
