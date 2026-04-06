// ══════════════════════════════════════════════════════════
//  布朗主廚貝果補貨團 - 訂單接收 GAS
//  部署方式：執行 → 以網頁應用程式部署
//    - 執行身分：我（你的 Google 帳號）
//    - 存取者：所有人
// ══════════════════════════════════════════════════════════

// 第一次執行時自動建立試算表，之後自動沿用同一份
function getOrCreateSheet() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SPREADSHEET_ID');

  if (!ssId) {
    const ss = SpreadsheetApp.create('🥯 布朗主廚貝果補貨團 訂單紀錄');
    const sheet = ss.getActiveSheet();
    sheet.setName('訂單');

    // 設定標題列
    const headers = ['時間戳記', '姓名', '訂購品項', '總金額', '備註及回覆'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // 格式美化
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#5c3317');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);

    // 欄位寬度
    sheet.setColumnWidth(1, 160); // 時間
    sheet.setColumnWidth(2, 100); // 姓名
    sheet.setColumnWidth(3, 380); // 品項
    sheet.setColumnWidth(4, 90);  // 金額
    sheet.setColumnWidth(5, 250); // 備註

    // 凍結標題列
    sheet.setFrozenRows(1);

    ssId = ss.getId();
    props.setProperty('SPREADSHEET_ID', ssId);
    Logger.log('新試算表已建立，ID: ' + ssId);
    Logger.log('試算表網址: ' + ss.getUrl());
  }

  const ss = SpreadsheetApp.openById(ssId);
  return ss.getSheetByName('訂單') || ss.getSheets()[0];
}

// 取得試算表網址（部署後可在 Logger 查看）
function getSpreadsheetUrl() {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  if (!ssId) {
    Logger.log('尚未建立試算表，請先送出一筆訂單');
    return;
  }
  const ss = SpreadsheetApp.openById(ssId);
  Logger.log('試算表網址: ' + ss.getUrl());
}

// 接收 POST 訂單
function doPost(e) {
  try {
    const params = e.parameter;
    const name    = params.name    || '（未填）';
    const items   = params.items   || '（未填）';
    const total   = params.total   || '0';
    const note    = params.note    || '（無）';

    const sheet = getOrCreateSheet();
    const now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');

    sheet.appendRow([now, name, items, Number(total), note]);

    // 將品項欄設為自動換行
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 3).setWrap(true);
    sheet.getRange(lastRow, 5).setWrap(true);

    // 交替行底色
    const color = (lastRow % 2 === 0) ? '#fff8f0' : '#ffffff';
    sheet.getRange(lastRow, 1, 1, 5).setBackground(color);

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
