const SHEET_ID = '1Q022EXoMxXr_dl9ewZaeQMTALX4mGK4IuGExESIeFHE';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    if (data.action === 'saveTask') saveTask(ss, data);
    else if (data.action === 'saveMission') saveMission(ss, data);
    else if (data.action === 'saveMissionDef') saveMissionDef(ss, data);
    else if (data.action === 'deleteTask') deleteTask(ss, data);
    else if (data.action === 'saveStreak') saveStreak(ss, data);
    else if (data.action === 'saveClients') saveClients(ss, data);
    else if (data.action === 'saveMemo') saveMemo(ss, data);
    else if (data.action === 'deleteMemo') deleteMemo(ss, data);
    else if (data.action === 'saveWish') saveWish(ss, data);
    else if (data.action === 'deleteWish') deleteWish(ss, data);
    else if (data.action === 'saveSubscription') saveSubscription(ss, data);
    else if (data.action === 'deleteSubscription') deleteSubscription(ss, data);
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({success:false,error:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    if (e.parameter.action === 'getTasks') return ContentService.createTextOutput(JSON.stringify({success:true,data:getTasks(ss)})).setMimeType(ContentService.MimeType.JSON);
    if (e.parameter.action === 'getMissions') return ContentService.createTextOutput(JSON.stringify({success:true,data:getMissions(ss)})).setMimeType(ContentService.MimeType.JSON);
    if (e.parameter.action === 'getMissionsByDate') return ContentService.createTextOutput(JSON.stringify({success:true,data:getMissionsByDate(ss, e.parameter.date)})).setMimeType(ContentService.MimeType.JSON);
    if (e.parameter.action === 'getMissionDefs') return ContentService.createTextOutput(JSON.stringify({success:true,data:getMissionDefs(ss)})).setMimeType(ContentService.MimeType.JSON);
    if (e.parameter.action === 'getStreak') return ContentService.createTextOutput(JSON.stringify({success:true,data:getStreak(ss)})).setMimeType(ContentService.MimeType.JSON);
    if (e.parameter.action === 'getClients') return ContentService.createTextOutput(JSON.stringify({success:true,data:getClients(ss)})).setMimeType(ContentService.MimeType.JSON);
    if (e.parameter.action === 'getMemos') return ContentService.createTextOutput(JSON.stringify({success:true,data:getMemos(ss)})).setMimeType(ContentService.MimeType.JSON);
    if (e.parameter.action === 'getWishes') return ContentService.createTextOutput(JSON.stringify({success:true,data:getWishes(ss)})).setMimeType(ContentService.MimeType.JSON);
    if (e.parameter.action === 'getSubscriptions') return ContentService.createTextOutput(JSON.stringify({success:true,data:getSubscriptions(ss)})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({success:false,error:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 日付をYYYY-MM-DD文字列に変換（グローバル関数）
function dateToStr(d) {
  if (!d && d !== 0) return '';
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + day;
  }
  const s = String(d).trim().replace(/\s+/g, '');
  const m1 = s.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (m1) return m1[1]+'-'+m1[2].padStart(2,'0')+'-'+m1[3].padStart(2,'0');
  const m2 = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m2) return m2[1]+'-'+m2[2].padStart(2,'0')+'-'+m2[3].padStart(2,'0');
  return s;
}

// ===== タスク =====
function saveTask(ss, data) {
  const sheet = getOrCreateSheet(ss, 'タスク履歴', ['ID','日付','タスク名','クライアント','カテゴリ','状態','完了日時','順番']);
  const rows = sheet.getDataRange().getValues();
  const idx = rows.findIndex(r => r[0] == data.id);
  const row = [
    data.id,
    idx > 0 ? rows[idx][1] : new Date().toISOString().split('T')[0],
    data.name,
    data.client || '',
    data.cat,
    data.done ? '完了' : '未完了',
    data.done ? new Date().toLocaleString('ja-JP') : '',
    data.order || 0
  ];
  if (idx > 0) sheet.getRange(idx+1, 1, 1, 8).setValues([row]);
  else sheet.appendRow(row);
}

function deleteTask(ss, data) {
  const sheet = getOrCreateSheet(ss, 'タスク履歴', ['ID','日付','タスク名','クライアント','カテゴリ','状態','完了日時','順番']);
  const rows = sheet.getDataRange().getValues();
  const idx = rows.findIndex(r => r[0] == data.id);
  if (idx > 0) sheet.deleteRow(idx + 1);
}

function getTasks(ss) {
  const sheet = getOrCreateSheet(ss, 'タスク履歴', ['ID','日付','タスク名','クライアント','カテゴリ','状態','完了日時','順番']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    id: r[0], date: dateToStr(r[1]), name: r[2], client: r[3],
    cat: r[4], done: r[5] === '完了', completedAt: r[6], order: r[7]
  }));
}

// ===== ミッション =====
function saveMission(ss, data) {
  const sheet = getOrCreateSheet(ss, 'ミッション記録', ['日付','曜日','カテゴリ','タイトル','達成']);

  // A列を全て文字列書式に設定（日付型への自動変換を防ぐ）
  sheet.getRange('A:A').setNumberFormat('@STRING@');

  const rows = sheet.getDataRange().getValues();
  const incomingDate = String(data.date).trim();
  const incomingTitle = String(data.title).trim();
  const isDone = (data.done === true || data.done === 'true' || data.done === '✓');

  Logger.log('saveMission: date=[' + incomingDate + '] title=[' + incomingTitle + '] done=' + isDone);

  // 全行スキャン
  const matchRows = [];
  for (let i = 1; i < rows.length; i++) {
    const rowDate = dateToStr(rows[i][0]).trim();
    const rowTitle = String(rows[i][3]).trim();
    Logger.log('Row' + (i+1) + ': date=[' + rowDate + '] title=[' + rowTitle + '] dateMatch=' + (rowDate === incomingDate) + ' titleMatch=' + (rowTitle === incomingTitle));
    if (rowDate === incomingDate && rowTitle === incomingTitle) {
      matchRows.push(i + 1);
    }
  }
  Logger.log('matchRows: ' + JSON.stringify(matchRows));

  if (isDone) {
    const row = [incomingDate, String(data.day), String(data.cat), incomingTitle, '✓'];
    if (matchRows.length > 0) {
      for (let i = matchRows.length - 1; i >= 1; i--) sheet.deleteRow(matchRows[i]);
      sheet.getRange(matchRows[0], 1, 1, 5).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  } else {
    for (let i = matchRows.length - 1; i >= 0; i--) {
      sheet.deleteRow(matchRows[i]);
    }
  }
}

function getMissions(ss) {
  const sheet = getOrCreateSheet(ss, 'ミッション記録', ['日付','曜日','カテゴリ','タイトル','達成']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    date: dateToStr(r[0]), day: r[1], cat: r[2], title: r[3], done: r[4] === '✓'
  }));
}

// ===== ミッション定義（動的・日付指定） =====
// シート「ミッション定義」: 日付 | index(0-2) | カテゴリ | タイトル | 詳細 | 目安時間
function saveMissionDef(ss, data) {
  const sheet = getOrCreateSheet(ss, 'ミッション定義', ['日付','index','カテゴリ','タイトル','詳細','目安時間']);
  sheet.getRange('A:A').setNumberFormat('@STRING@');

  const rows = sheet.getDataRange().getValues();
  const missions = data.missions; // [{index, cat, title, detail, time}, ...]

  missions.forEach(m => {
    const incomingDate = String(data.date).trim();
    const idx = m.index;

    // 同じ日付×indexの行を探して上書き、なければ追加
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      const rowDate = dateToStr(rows[i][0]).trim();
      const rowIdx = Number(rows[i][1]);
      if (rowDate === incomingDate && rowIdx === idx) {
        sheet.getRange(i + 1, 1, 1, 6).setValues([[incomingDate, idx, m.cat, m.title, m.detail || '', m.time || '']]);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([incomingDate, idx, m.cat, m.title, m.detail || '', m.time || '']);
    }
  });
}

// 指定日付のミッション定義を取得（3件）
function getMissionsByDate(ss, date) {
  const sheet = getOrCreateSheet(ss, 'ミッション定義', ['日付','index','カテゴリ','タイトル','詳細','目安時間']);
  sheet.getRange('A:A').setNumberFormat('@STRING@');
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const target = String(date).trim();
  const result = [];
  for (let i = 1; i < rows.length; i++) {
    const rowDate = dateToStr(rows[i][0]).trim();
    if (rowDate === target) {
      result.push({
        index: Number(rows[i][1]),
        cat: rows[i][2],
        title: rows[i][3],
        detail: rows[i][4],
        time: rows[i][5]
      });
    }
  }
  // indexでソート
  result.sort((a, b) => a.index - b.index);
  return result;
}

// 直近N日分のミッション定義を一括取得（アプリ起動時用）
function getMissionDefs(ss) {
  const sheet = getOrCreateSheet(ss, 'ミッション定義', ['日付','index','カテゴリ','タイトル','詳細','目安時間']);
  sheet.getRange('A:A').setNumberFormat('@STRING@');
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  // 直近30日以内のデータのみ返す
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = dateToStr(cutoff);

  const map = {}; // { 'YYYY-MM-DD': [{index,cat,title,detail,time}, ...] }
  for (let i = 1; i < rows.length; i++) {
    const rowDate = dateToStr(rows[i][0]).trim();
    if (rowDate < cutoffStr) continue;
    if (!map[rowDate]) map[rowDate] = [];
    map[rowDate].push({
      index: Number(rows[i][1]),
      cat: rows[i][2],
      title: rows[i][3],
      detail: rows[i][4],
      time: rows[i][5]
    });
  }
  // 各日付内でindexソート
  Object.keys(map).forEach(d => map[d].sort((a, b) => a.index - b.index));
  return map;
}

// ===== ストリーク =====
function saveStreak(ss, data) {
  const sheet = getOrCreateSheet(ss, '統計', ['日付','連続日数']);
  const rows = sheet.getDataRange().getValues();
  const idx = rows.findIndex(r => r[0] === data.date);
  if (idx > 0) sheet.getRange(idx+1, 1, 1, 2).setValues([[data.date, data.streak]]);
  else sheet.appendRow([data.date, data.streak]);
}

function getStreak(ss) {
  const sheet = getOrCreateSheet(ss, '統計', ['日付','連続日数']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return 0;
  return rows[rows.length - 1][1] || 0;
}

// ===== クライアント =====
function saveClients(ss, data) {
  const sheet = getOrCreateSheet(ss, 'クライアント', ['データ']);
  if (sheet.getLastRow() < 2) sheet.appendRow([data.clients]);
  else sheet.getRange(2, 1).setValue(data.clients);
}

function getClients(ss) {
  const sheet = getOrCreateSheet(ss, 'クライアント', ['データ']);
  if (sheet.getLastRow() < 2) return [];
  const val = sheet.getRange(2, 1).getValue();
  try { return JSON.parse(val); } catch(e) { return []; }
}

// ===== メモ =====
function saveMemo(ss, data) {
  const sheet = getOrCreateSheet(ss, '案件メモ', ['ID','クライアント','テキスト','日付','日付JP']);
  const rows = sheet.getDataRange().getValues();
  const idx = rows.findIndex(r => r[0] == data.id);
  const row = [data.id, data.client, data.text, data.date, data.dateStr || ''];
  if (idx > 0) sheet.getRange(idx + 1, 1, 1, 5).setValues([row]);
  else sheet.appendRow(row);
}

function deleteMemo(ss, data) {
  const sheet = getOrCreateSheet(ss, '案件メモ', ['ID','クライアント','テキスト','日付','日付JP']);
  const rows = sheet.getDataRange().getValues();
  const idx = rows.findIndex(r => r[0] == data.id);
  if (idx > 0) sheet.deleteRow(idx + 1);
}

function getMemos(ss) {
  const sheet = getOrCreateSheet(ss, '案件メモ', ['ID','クライアント','テキスト','日付','日付JP']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    id: r[0], client: r[1], text: r[2], date: r[3], dateStr: r[4]
  }));
}


// ===== やりたいことメモ =====
function saveWish(ss, data) {
  const sheet = getOrCreateSheet(ss, 'やりたいことメモ', ['ID','テキスト','日付']);
  sheet.getRange('A:A').setNumberFormat('@STRING@');
  const rows = sheet.getDataRange().getValues();
  const id = String(data.id);
  const idx = rows.findIndex(r => String(r[0]) === id);
  const row = [id, data.text, String(data.date)];
  if (idx > 0) sheet.getRange(idx + 1, 1, 1, 3).setValues([row]);
  else sheet.appendRow(row);
}

function deleteWish(ss, data) {
  const sheet = getOrCreateSheet(ss, 'やりたいことメモ', ['ID','テキスト','日付']);
  const rows = sheet.getDataRange().getValues();
  const id = String(data.id);
  const idx = rows.findIndex(r => String(r[0]) === id);
  if (idx > 0) sheet.deleteRow(idx + 1);
}

function getWishes(ss) {
  const sheet = getOrCreateSheet(ss, 'やりたいことメモ', ['ID','テキスト','日付']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    id: Number(r[0]),
    text: r[1],
    date: dateToStr(r[2]),
    dateStr: dateToStr(r[2])
  }));
}


// ===== Push通知購読 =====
function saveSubscription(ss, data) {
  const sheet = getOrCreateSheet(ss, 'Push購読', ['ID','購読情報','登録日']);
  sheet.getRange('A:A').setNumberFormat('@STRING@');
  const rows = sheet.getDataRange().getValues();
  const id = String(data.id);
  const idx = rows.findIndex(r => String(r[0]) === id);
  const row = [id, data.subscription, new Date().toISOString()];
  if (idx > 0) sheet.getRange(idx + 1, 1, 1, 3).setValues([row]);
  else sheet.appendRow(row);
}

function deleteSubscription(ss, data) {
  const sheet = getOrCreateSheet(ss, 'Push購読', ['ID','購読情報','登録日']);
  const rows = sheet.getDataRange().getValues();
  const id = String(data.id);
  const idx = rows.findIndex(r => String(r[0]) === id);
  if (idx > 0) sheet.deleteRow(idx + 1);
}

function getSubscriptions(ss) {
  const sheet = getOrCreateSheet(ss, 'Push購読', ['ID','購読情報','登録日']);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).map(r => ({
    id: r[0],
    subscription: r[1]
  }));
}

function testSaveMission() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  saveMission(ss, {
    date: '2026-06-27',
    day: '土曜',
    cat: '💪 体・習慣',
    title: '30分以上歩く',
    done: false
  });
}
