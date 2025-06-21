# 家族向けお小遣い管理アプリ

## 📋 概要

子供の金融リテラシー教育を含む家族向けお小遣い管理システムです。

### 主要機能

- **親用機能**
  - タスク管理（作成・編集・削除）
  - 子供の完了申請の承認・却下
  - ポイント付与システム
  - 統計・レポート確認

- **子供用機能**
  - タスク一覧の確認
  - タスク完了の報告
  - ポイント残高の確認
  - 進捗状況の確認

## 🚀 開発環境セットアップ

### 前提条件
- Node.js (v16以上)
- npm

### インストール手順

1. 依存関係のインストール
```bash
npm install
```

2. 開発サーバーの起動
```bash
npm run dev
```

3. ブラウザで http://localhost:3000 にアクセス

## 📱 使用方法

### デモアカウント

**保護者アカウント**
- Email: parent@example.com
- Password: demo

**子供アカウント**
- Email: child@example.com
- Password: demo

### 基本的な使い方

1. **保護者として**
   - タスクを作成
   - 子供の完了申請を承認・却下
   - ポイント残高を確認

2. **子供として**
   - 利用可能なタスクを確認
   - タスクを完了して報告
   - ポイント残高を確認

## 🛠️ 技術スタック

- **フロントエンド**: React + TypeScript + Tailwind CSS
- **状態管理**: React Hooks + Context API
- **ルーティング**: React Router
- **フォーム管理**: React Hook Form
- **アイコン**: Lucide React
- **ストレージ**: LocalStorage (デモ版)
- **ビルドツール**: Vite

## 📁 プロジェクト構造

```
src/
├── components/         # UIコンポーネント
│   ├── Dashboard.tsx
│   ├── LoginForm.tsx
│   ├── ParentDashboard.tsx
│   └── ChildDashboard.tsx
├── hooks/              # カスタムフック
│   └── useAuth.tsx
├── types/              # TypeScript型定義
│   └── index.ts
├── utils/              # ユーティリティ関数
│   └── storage.ts
├── App.tsx             # メインアプリ
└── main.tsx           # エントリーポイント
```

## 🧪 コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# ビルド結果をプレビュー
npm run preview

# TypeScript型チェック
npm run type-check
```

## 📝 実装済み機能

- ✅ ユーザー認証（親・子供の役割分離）
- ✅ 基本的なタスク管理（作成・編集・削除）
- ✅ ポイント付与・計算システム
- ✅ シンプルな承認フロー
- ✅ レスポンシブ基本UI
- ✅ ポイント履歴表示

## 🔄 今後の実装予定

### Phase 2: 機能拡張
- イベント管理機能
- 柔軟なレート設定システム
- 通知システム（申請・承認）
- 統計・レポート機能
- データエクスポート機能

### Phase 3: 金融教育機能
- ポイント運用システム
- 年利計算・複利シミュレーション
- 年齢連動レート自動調整
- 貯蓄目標設定機能
- 金融教育コンテンツ

## 📄 ライセンス

MIT License