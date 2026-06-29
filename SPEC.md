# Mission HQ 仕様書

## アプリの目的

準ちゃん（長崎準也）が「なりたい自分」に向かって日々前進するためのパーソナルコーチングアプリ。
単なるタスク管理ではなく、Claudeが準ちゃんの状況・達成履歴・やりたいことを把握しながら、
毎週ミッションを提案し、一緒に成長の方向を作っていく。

---

## システム構成

```
Claude（このチャット）
  ↓ GitHub API で missions.json を push
GitHub リポジトリ（JunyaNagasaki/missionhq）
  ↓ push を検知して自動起動
GitHub Actions（.github/workflows/send-missions.yml）
  ↓ send_missions.py を実行 → curl POST
Netlify Functions（set-missions.js）※ Netlify の中に住んでいる
  ↓ GAS に転送
GAS（Google Apps Script）
  ↓ スプレッドシートに書き込み
Googleスプレッドシート（ミッション定義シート）
  ↓ アプリが5分ごとに自動取得
Mission HQ アプリ（Netlify でホスティング）
```

## 各コンポーネントの役割

### Netlify
- HTML（index.html）を配信するホスティングサービス
- dreamy-strudel-2ef597.netlify.app でアクセスできる
- PWA（Progressive Web App）としてスマホのホーム画面にも追加できる
- **Netlify Functions** は Netlify の中に設置できるサーバー側プログラム（set-missions.js）
  - Claudeや GitHub Actions からのリクエストを受けて GAS に転送する「受付窓口」
  - 無料枠：月125,000回まで

### GAS（Google Apps Script）
- Googleのサーバー上で動くプログラム
- スプレッドシートへの読み書きを担当する「データベース層」
- 主な処理：
  - `saveMissionDef` → ミッション定義をシートに保存
  - `getMissionDefs` → アプリ起動時にミッション定義を返す
  - `saveMission` → チェックのON/OFFを記録
  - `getMissions` → チェック状態を返す（PC↔スマホ同期の根拠）
  - `saveTask` / `getTasks` → タスクの保存・取得
  - `saveMemo` / `getMemos` → 案件メモの保存・取得
  - `saveWish` / `getWishes` → やりたいことメモの保存・取得

### スプレッドシート（ID: 1Q022EXoMxXr_dl9ewZaeQMTALX4mGK4IuGExESIeFHE）
- シート一覧：
  - `ミッション定義`：Claudeが毎週書き込むミッション7日×3つ
  - `ミッション記録`：チェックのON/OFF履歴
  - `タスク履歴`：完了タスクの記録
  - `クライアント`：クライアント一覧
  - `案件メモ`：クライアント別メモ
  - `やりたいことメモ`：気軽に追加するメモ

---

## 機能一覧

### ミッション管理
- 毎週日曜夜にサマリーを Claude に送る
- Claude が状況を分析・コーチング後、来週7日×3つのミッションを生成
- GitHub API → GitHub Actions → Netlify Functions → GAS → スプレッドシートに自動保存
- アプリが5分ごとに自動同期して表示を更新
- PC・スマホでチェック状態が共有される

### タスク管理
- クライアント別タブで管理
- ドラッグで並び替え可能
- 完了・削除 → GAS に即時保存

### 振り返り
- 週次グラフ（日別達成数）
- ミッション達成履歴
- 完了タスク履歴
- 週次サマリーの自動生成・コピー

### 案件メモ
- クライアント別のメモ
- GAS に保存・同期

### やりたいことメモ
- 気軽にテキスト追加
- GAS に保存
- 週次サマリーに自動で含まれる
- Claude がミッション提案のヒントにする

---

## カテゴリ
| 絵文字 | カテゴリ名 |
|--------|-----------|
| 💰 | 仕事・収入 |
| 🎵 | 音楽・ライブ |
| 💪 | 健康・体 |
| 📚 | 学習・スキル |
| 🎉 | 趣味・楽しむ |

---

## 週次フロー

```
毎週日曜夜
① アプリの「振り返り」タブから週次サマリーをコピー
② Claude（このプロジェクト）に貼り付け
③ Claude が振り返りコーチング（未達成の確認、状況ヒアリング）
④ Claude が来週7日分×3つのミッションを生成
⑤ GitHub API 経由で missions.json を更新
⑥ GitHub Actions が自動起動してアプリに反映
⑦ 翌朝アプリを開くと新しいミッションが届いている
```

---

## インフラ詳細

| 項目 | 値 |
|------|-----|
| フロントエンド URL | dreamy-strudel-2ef597.netlify.app |
| スプレッドシート ID | 1Q022EXoMxXr_dl9ewZaeQMTALX4mGK4IuGExESIeFHE |
| GAS URL | https://script.google.com/macros/s/AKfycbzIKClwERGtKW1ujRSyc1iVROJvN3HvwNrv0Vo58M4AuL5tSQYGPBHsTwb2DGpITAQ/exec |
| Netlify Functions | dreamy-strudel-2ef597.netlify.app/.netlify/functions/set-missions |
| GitHub リポジトリ | github.com/JunyaNagasaki/missionhq |
| ローカルフォルダ | ~/Desktop/missionhq |
| LocalStorage KEY | mhq_v10 |

---

## 技術スタック

- フロントエンド：HTML / CSS / Vanilla JS（単一ファイル）
- ホスティング：Netlify（PWA対応・Service Worker v6）
- API中継：Netlify Functions（Node.js）
- バックエンド：Google Apps Script（GAS）
- データベース：Googleスプレッドシート
- CI/CD：GitHub Actions
- バージョン管理：Git / GitHub

---

## 重要な設計方針

- **doneMap はタイトル名ベース**：PC/スマホ間の同期はミッションタイトル名でチェック状態を管理
- **GAS が唯一の真実**：アプリ起動時・5分ごとの自動同期で GAS のデータに上書き
- **JST 基準の日付計算**：全ての日付処理は Asia/Tokyo タイムゾーンで統一
- **Service Worker v6**：HTML はネットワーク優先（キャッシュ問題を防ぐ）
