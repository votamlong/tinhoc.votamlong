/* Thêm file này vào dự án Apps Script (giữ nguyên Mã.gs). Sau đó: Triển khai > Quản lý > Chỉnh sửa > Phiên bản mới.
   Web App: Chạy dưới quyền "Tôi", Ai có quyền truy cập: "Bất kỳ ai". */
const BLOCK = new Set(['setupDatabase', 'onOpen', 'doGet', 'doPost', 'include', 'generateErrorCodes']);
const ADMIN_ONLY = new Set(['getAllUsers', 'saveUser', 'deleteUser', 'updateStudentGlobal']);

function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents), fn = String(req.fn || ''), args = req.args || [];
    if (BLOCK.has(fn) || fn.endsWith('_') || typeof globalThis[fn] !== 'function') throw new Error('Hàm không hợp lệ: ' + fn);
    const cache = CacheService.getScriptCache();
    if (fn === 'loginUser') {
      const res = loginUser.apply(null, args);
      if (res && res.success) { const t = Utilities.getUuid(); cache.put('tok_' + t, String(res.role || '').toUpperCase(), 21600); res.token = t; }
      out = { result: res };
    } else {
      const role = req.token ? cache.get('tok_' + req.token) : null;
      if (!role) return json_({ authError: true });
      if (ADMIN_ONLY.has(fn) && role !== 'ADMIN') throw new Error('Không đủ quyền');
      out = { result: globalThis[fn].apply(null, args) };
    }
  } catch (err) { out = { error: String(err.message || err) }; }
  return json_(out);
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* CRUD chung cho các menu mới: chỉ cho phép sheet tên M_XXXX */
function crudSheet_(name, headers) {
  if (!/^M_[A-Z0-9_]+$/.test(name)) throw new Error('Tên sheet không hợp lệ');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); }
  return sh;
}
function crudList(name, headers) {
  return crudSheet_(name, headers).getDataRange().getDisplayValues().slice(1).map((r, i) => ({ row: i + 2, cells: r }));
}
function crudAdd(name, headers, cells) { crudSheet_(name, headers).appendRow(cells); return 'OK'; }
function crudDelete(name, headers, row) { crudSheet_(name, headers).deleteRow(Number(row)); return 'OK'; }
/* Cũng nhớ dán LuckyWheel_Server.gs (getLuckyClasses, getLuckyStudentsByClass) vào dự án. */
