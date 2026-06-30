// 毎朝9時にGitHub Actionsから呼ばれる: 全購読者にPush通知を送信
const webpush = require('web-push');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzIKClwERGtKW1ujRSyc1iVROJvN3HvwNrv0Vo58M4AuL5tSQYGPBHsTwb2DGpITAQ/exec';

webpush.setVapidDetails(
  'mailto:j.nagasaki@whitebear3.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GASから購読情報一覧を取得
    const res = await fetch(`${GAS_URL}?action=getSubscriptions`);
    const result = await res.json();
    const subscriptions = result.data || [];

    if (subscriptions.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ message: '購読者なし', sent: 0 }) };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const payload = JSON.stringify({
      title: body.title || 'Mission HQ',
      body: body.body || '今日のミッションを確認しよう！'
    });

    let sent = 0;
    let failed = 0;
    for (const sub of subscriptions) {
      try {
        const subscription = JSON.parse(sub.subscription);
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err) {
        failed++;
        // 無効な購読は削除依頼
        if (err.statusCode === 410 || err.statusCode === 404) {
          await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteSubscription', id: sub.id })
          }).catch(() => {});
        }
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ sent, failed }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
