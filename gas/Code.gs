// ══════════════════════════════════════════════════════════
//  布朗主廚貝果補貨團 - 訂單接收 GAS（每商品獨立一欄）
//  部署方式：部署 → 新增部署作業 → 網頁應用程式
//    - 執行身分：我（你的 Google 帳號）
//    - 存取者：所有人
// ══════════════════════════════════════════════════════════

// 商品清單（順序決定欄位順序）
const PRODUCT_LIST = [
  { id: 'p01', name: '宇治金時貝果' },
  { id: 'p02', name: '抹茶原味貝果' },
  { id: 'p03', name: '焙香蕎奶糖貝也納' },
  { id: 'p04', name: '芋見乳酪' },
  { id: 'p05', name: '義式紅醬起士' },
  { id: 'p06', name: '經典黃金貝果' },
  { id: 'p07', name: '脆皮起司' },
  { id: 'p08', name: '藍莓果果' },
  { id: 'p09', name: '可可藍莓重乳酪' },
  { id: 'p10', name: '厚醬原味奶酥' },
  { id: 'p11', name: '花言巧語' },
  { id: 'p12', name: '原味藍莓重乳酪' },
  { id: 'p13', name: '貝也納-經典奶糖' },
  { id: 'p14', name: '貝也納-咖啡核桃' },
  { id: 'p15', name: '法國麵包-原味' },
  { id: 'p16', name: '法國麵包-香蒜' },
  { id: 'p17', name: '銅鑼燒-宇治抹茶6入' },
  { id: 'p18', name: '銅鑼燒-食好紅豆6入' },
  { id: 'p19', name: '銅鑼燒-經典原味6入' },
];

// 欄位順序：時間戳記 | 姓名 | p01...p19（各1欄）| 總金額 | 備註及回覆
const TOTAL_COLS = 2 + PRODUCT_LIST.length + 2; // 23 欄

function getOrCreateSheet() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SPREADSHEET_ID');

  if (!ssId) {
    const ss = SpreadsheetApp.create('🥯 布朗主廚貝果補貨團 訂單紀錄');
    const sheet = ss.getActiveSheet();
    sheet.setName('訂單');
    setupHeaders(sheet);
    ssId = ss.getId();
    props.setProperty('SPREADSHEET_ID', ssId);
    Logger.log('新試算表已建立，ID: ' + ssId);
    Logger.log('試算表網址: ' + ss.getUrl());
  }

  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName('訂單') || ss.getSheets()[0];

  // 如果標題格式是舊版（C欄是「訂購品項」），重建標題
  const c3 = sheet.getRange(1, 3).getValue();
  if (c3 === '訂購品項') {
    sheet.clearContents();
    setupHeaders(sheet);
  }

  return sheet;
}

function setupHeaders(sheet) {
  const headers = ['時間戳記', '姓名'];
  PRODUCT_LIST.forEach(p => headers.push(p.name));
  headers.push('總金額', '備註及回覆');

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 標題格式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#5c3317');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('center');

  // 欄寬
  sheet.setColumnWidth(1, 155);  // 時間
  sheet.setColumnWidth(2, 80);   // 姓名
  for (let i = 3; i <= 2 + PRODUCT_LIST.length; i++) {
    sheet.setColumnWidth(i, 80); // 各商品（數量欄窄一點）
  }
  sheet.setColumnWidth(2 + PRODUCT_LIST.length + 1, 80);   // 總金額
  sheet.setColumnWidth(2 + PRODUCT_LIST.length + 2, 200);  // 備註

  // 凍結標題列與姓名欄
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
}

// 取得試算表網址
function getSpreadsheetUrl() {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  if (!ssId) { Logger.log('尚未建立試算表'); return; }
  Logger.log('試算表網址: ' + SpreadsheetApp.openById(ssId).getUrl());
}

// 接收 POST 訂單
function doPost(e) {
  try {
    const params = e.parameter;
    const name  = params.name  || '（未填）';
    const total = Number(params.total) || 0;
    const note  = params.note  || '（無）';

    const sheet = getOrCreateSheet();
    const now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');

    // 組成一列資料：時間、姓名、各商品數量、總金額、備註
    const row = [now, name];
    PRODUCT_LIST.forEach(p => {
      const qty = parseInt(params[p.id] || '0', 10);
      row.push(qty > 0 ? qty : '');  // 0 顯示為空白較清晰
    });
    row.push(total, note);

    sheet.appendRow(row);

    // 格式：交替底色、數字置中
    const lastRow = sheet.getLastRow();
    const color = (lastRow % 2 === 0) ? '#fff8f0' : '#ffffff';
    sheet.getRange(lastRow, 1, 1, TOTAL_COLS).setBackground(color);
    sheet.getRange(lastRow, 3, 1, PRODUCT_LIST.length).setHorizontalAlignment('center');

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET 請求（測試用）
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: '布朗主廚貝果補貨團 訂單系統運作中' }))
    .setMimeType(ContentService.MimeType.JSON);
}
