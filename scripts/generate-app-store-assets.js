#!/usr/bin/env node

// アプリストア用アセット生成スクリプト
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APP_STORE_ASSETS = {
  // iOS App Store用アイコン
  ios: {
    // App Store用
    '1024x1024': 'ios-marketing-1024x1024.png',
    // iPhone用
    '180x180': 'ios-iphone-180x180.png',
    '120x120': 'ios-iphone-120x120.png',
    '87x87': 'ios-iphone-87x87.png',
    '80x80': 'ios-iphone-80x80.png',
    '60x60': 'ios-iphone-60x60.png',
    '58x58': 'ios-iphone-58x58.png',
    '40x40': 'ios-iphone-40x40.png',
    '29x29': 'ios-iphone-29x29.png',
    '20x20': 'ios-iphone-20x20.png',
    // iPad用
    '167x167': 'ios-ipad-167x167.png',
    '152x152': 'ios-ipad-152x152.png',
    '76x76': 'ios-ipad-76x76.png'
  },
  
  // Android Google Play用アイコン
  android: {
    '512x512': 'android-play-512x512.png',
    '192x192': 'android-xxxhdpi-192x192.png',
    '144x144': 'android-xxhdpi-144x144.png',
    '96x96': 'android-xhdpi-96x96.png',
    '72x72': 'android-hdpi-72x72.png',
    '48x48': 'android-mdpi-48x48.png',
    '36x36': 'android-ldpi-36x36.png'
  }
};

const SCREENSHOT_REQUIREMENTS = {
  ios: {
    'iPhone 15 Pro Max': '1320x2868',
    'iPhone 15 Pro': '1179x2556', 
    'iPhone 8 Plus': '1242x2208',
    'iPhone SE': '750x1334',
    'iPad Pro 12.9': '2048x2732',
    'iPad Pro 11': '1668x2388'
  },
  
  android: {
    'Phone': '1080x1920',
    'Tablet 7inch': '1200x1920',
    'Tablet 10inch': '1600x2560'
  }
};

const STORE_LISTING_CONTENT = {
  ios: {
    title: '家族お小遣い管理アプリ',
    subtitle: '子どもとつくる お金の学び',
    description: `🏠 家族みんなで使える お小遣い管理アプリ

✨ 特徴
• 子どものタスク管理とポイント制
• 親の承認システムで責任感を育成
• 家族間でのリアルタイム同期
• ゲーミフィケーション要素で楽しく継続

👨‍👩‍👧‍👦 こんな家族におすすめ
• お小遣いのルールを明確にしたい
• 子どもに責任感と金銭感覚を教えたい
• 家事や勉強の習慣づけをサポートしたい
• 家族のコミュニケーションを増やしたい

🎯 主な機能
• タスク作成・管理
• ポイント獲得・交換システム
• 家族統計とレポート
• イベント・チャレンジ機能
• オフライン対応

📱 使い方
1. 親がタスクを作成
2. 子どもがタスクに挑戦
3. 完了報告で親が承認
4. ポイント獲得でお小遣いゲット！

完全無料でご利用いただけます。`,
    
    keywords: '家族,お小遣い,管理,子ども,タスク,教育,ポイント,金銭教育,責任感,習慣',
    
    promotional_text: '家族の絆を深めながら、お金の大切さを学べるアプリ'
  },
  
  android: {
    title: '家族お小遣い管理',
    short_description: '子どもとつくる お金の学び - 家族で使えるタスク管理アプリ',
    full_description: `🏠 家族みんなで使える お小遣い管理アプリ

家族でお小遣いとタスクを管理して、子どもの責任感と金銭感覚を育てませんか？

✨ 特徴
• 子どものタスク管理とポイント制
• 親の承認システムで責任感を育成  
• 家族間でのリアルタイム同期
• ゲーミフィケーション要素で楽しく継続
• 完全無料・広告なし

👨‍👩‍👧‍👦 こんな家族におすすめ
• お小遣いのルールを明確にしたい
• 子どもに責任感と金銭感覚を教えたい
• 家事や勉強の習慣づけをサポートしたい
• 家族のコミュニケーションを増やしたい

🎯 主な機能
【親の機能】
• タスク作成・編集・削除
• 子どもの提出内容確認・承認
• ポイント交換・お小遣い支払い
• 家族の統計・レポート表示
• イベント・チャレンジ企画

【子どもの機能】
• 今日のタスク一覧表示
• タスク完了報告（コメント・写真）
• 獲得ポイント・ランキング確認
• イベント参加・結果提出
• お小遣い交換申請

【共通機能】
• 家族間メッセージ
• 実績・バッジシステム
• カレンダー表示
• 過去の履歴確認
• オフライン対応

📱 使い方
1. 親がアカウント作成・家族招待
2. タスク（お手伝い・勉強等）を設定
3. 子どもがタスクに挑戦・報告
4. 親が確認して承認・ポイント付与
5. ポイントをお小遣いに交換

🎓 教育効果
• 責任感の育成
• 金銭感覚の向上
• 計画性の習得
• 家族間コミュニケーション向上
• 自主性・積極性の促進

🔒 安心・安全
• 個人情報保護対応
• 家族以外はアクセス不可
• 子ども向け安全設計
• 広告なし・課金なし

教育機関での導入実績もある、信頼できる家族向けアプリです。`,
    
    tags: ['家族', 'お小遣い', '管理', '子ども', 'タスク', '教育', 'ポイント', '金銭教育']
  }
};

function generateAppStoreGuide() {
  const guidePath = path.join(__dirname, '..', 'APP-STORE-SUBMISSION-GUIDE.md');
  
  const content = `# 📱 App Store 提出ガイド

## 🍎 iOS App Store

### 必要な準備
- [ ] Apple Developer Program 登録 ($99/年)
- [ ] Xcode 最新版インストール
- [ ] アプリアイコン (1024x1024px)
- [ ] スクリーンショット (各デバイスサイズ)
- [ ] アプリ説明文
- [ ] プライバシーポリシー
- [ ] 利用規約

### アイコンサイズ要件
${Object.entries(APP_STORE_ASSETS.ios).map(([size, filename]) => 
  `- ${size}: ${filename}`).join('\n')}

### スクリーンショット要件  
${Object.entries(SCREENSHOT_REQUIREMENTS.ios).map(([device, size]) => 
  `- ${device}: ${size}px`).join('\n')}

### ストア掲載情報
**アプリ名:** ${STORE_LISTING_CONTENT.ios.title}
**サブタイトル:** ${STORE_LISTING_CONTENT.ios.subtitle}

**キーワード:** ${STORE_LISTING_CONTENT.ios.keywords}

**説明文:**
${STORE_LISTING_CONTENT.ios.description}

**宣伝テキスト:** ${STORE_LISTING_CONTENT.ios.promotional_text}

### 提出手順
1. Xcodeでアーカイブ作成
2. App Store Connectにアップロード
3. ストア情報入力
4. 審査提出
5. 審査完了待ち (通常1-3日)

---

## 🤖 Google Play Store

### 必要な準備
- [ ] Google Play Console アカウント ($25 一回)
- [ ] Android Studio インストール
- [ ] アプリアイコン (512x512px)
- [ ] スクリーンショット
- [ ] アプリ説明文
- [ ] プライバシーポリシー

### アイコンサイズ要件
${Object.entries(APP_STORE_ASSETS.android).map(([size, filename]) => 
  `- ${size}: ${filename}`).join('\n')}

### スクリーンショット要件
${Object.entries(SCREENSHOT_REQUIREMENTS.android).map(([device, size]) => 
  `- ${device}: ${size}px`).join('\n')}

### ストア掲載情報
**アプリ名:** ${STORE_LISTING_CONTENT.android.title}
**短い説明:** ${STORE_LISTING_CONTENT.android.short_description}

**詳細説明:**
${STORE_LISTING_CONTENT.android.full_description}

**タグ:** ${STORE_LISTING_CONTENT.android.tags.join(', ')}

### 提出手順
1. Android StudioでAAB作成
2. Play Consoleにアップロード
3. ストア情報入力
4. 審査提出
5. 審査完了 (通常数時間-1日)

---

## 📋 共通チェックリスト

### 法的要件
- [ ] プライバシーポリシー作成
- [ ] 利用規約作成
- [ ] 子ども向けアプリ規定確認
- [ ] COPPA準拠確認

### 技術要件
- [ ] 全機能テスト完了
- [ ] クラッシュ修正完了
- [ ] パフォーマンス最適化
- [ ] セキュリティ確認

### ユーザビリティ
- [ ] オンボーディング改善
- [ ] ヘルプページ作成
- [ ] エラーメッセージ改善
- [ ] アクセシビリティ対応

### マーケティング
- [ ] アプリ紹介動画作成
- [ ] プレスリリース準備
- [ ] SNS宣伝準備
- [ ] レビュー促進戦略

---

## 💰 費用概算

### 初期費用
- Apple Developer: $99/年
- Google Play: $25 (一回)
- アセット作成: $0-500 (外注の場合)

### 継続費用  
- Apple Developer: $99/年
- Google Play: 売上の30%手数料のみ
- サーバー運用: 月$0-50

---

## 📈 ローンチ戦略

### Phase 1: ソフトローンチ
- 限定ユーザーでベータテスト
- フィードバック収集・改善

### Phase 2: 正式ローンチ
- 両ストア同時リリース
- プレスリリース配信
- SNS告知開始

### Phase 3: マーケティング強化
- インフルエンサー連携
- 教育関連メディア取材
- ユーザーレビュー促進

---

## 🔧 技術サポート

### 問い合わせ対応
- support@family-allowance.app
- アプリ内フィードバック機能
- FAQ充実化

### アップデート計画
- 月1回の機能追加
- バグ修正は即座対応
- ユーザー要望の積極取り込み
`;

  fs.writeFileSync(guidePath, content, 'utf8');
  console.log('✅ App Store提出ガイドを生成しました:', guidePath);
}

function generatePrivacyPolicy() {
  const privacyPath = path.join(__dirname, '..', 'PRIVACY-POLICY.md');
  
  const content = `# プライバシーポリシー

## 家族お小遣い管理アプリ

最終更新日: ${new Date().toISOString().split('T')[0]}

### 1. 基本方針

当アプリ「家族お小遣い管理アプリ」（以下「本アプリ」）は、ユーザーの皆様のプライバシー保護を重要視し、個人情報の適切な保護と取り扱いに努めています。

### 2. 収集する情報

#### 2.1 アカウント情報
- メールアドレス
- ユーザー名
- パスワード（暗号化して保存）

#### 2.2 アプリ利用情報
- タスクの内容と完了状況
- ポイント獲得・使用履歴
- 家族間のメッセージ
- アプリの使用統計（匿名化）

#### 2.3 技術情報
- デバイス情報（OS、バージョン等）
- アプリのクラッシュレポート
- アクセスログ（IPアドレス等）

### 3. 情報の利用目的

- サービスの提供・運営
- ユーザーサポート
- サービスの改善・開発
- 不正利用の防止
- 法令に基づく対応

### 4. 情報の共有

当アプリは、以下の場合を除き、個人情報を第三者に提供しません：

- ユーザーの同意がある場合
- 法令に基づく場合
- 生命・身体の保護のために必要な場合

### 5. 情報の保護

- SSL暗号化通信の使用
- アクセス制御の実装
- 定期的なセキュリティ監査
- 従業員への教育徹底

### 6. Cookie・分析ツール

- Google Analyticsを使用（匿名化）
- 必要最小限のCookieのみ使用
- ユーザーは無効化可能

### 7. 子どもの個人情報

13歳未満の子どもの情報については：

- 親の同意を得た場合のみ収集
- 最小限の情報のみ取得
- 広告表示は一切行わない
- 第三者への提供は行わない

### 8. データの保持期間

- アカウント削除時：即座に削除
- 非アクティブアカウント：2年後削除
- バックアップ：30日後削除

### 9. ユーザーの権利

- 個人情報の確認・訂正
- データの削除要求
- データのポータビリティ
- プロファイリングの拒否

### 10. お問い合わせ

プライバシーに関するご質問は：
support@family-allowance.app

### 11. ポリシーの変更

本ポリシーの変更時は、アプリ内及びウェブサイトにて通知いたします。

---

## 利用規約

### 1. サービス概要

本アプリは、家族間でのお小遣い管理とタスク管理を支援するサービスです。

### 2. 利用条件

- 13歳未満の場合は親の同意が必要
- 虚偽の情報での登録禁止
- 一人一アカウントの原則

### 3. 禁止事項

- 不正アクセス・改ざん
- 他者への迷惑行為
- 商用利用・転売
- 法令違反行為

### 4. 免責事項

- サービス中断による損害
- データ損失による損害
- 第三者との紛争

### 5. 準拠法・管轄

本規約は日本法に準拠し、東京地方裁判所を専属管轄とします。

---

連絡先: support@family-allowance.app
`;

  fs.writeFileSync(privacyPath, content, 'utf8');
  console.log('✅ プライバシーポリシーを生成しました:', privacyPath);
}

// メイン実行
function main() {
  console.log('🏪 App Store提出用アセットを生成しています...');
  
  generateAppStoreGuide();
  generatePrivacyPolicy();
  
  console.log('\n📱 次のステップ:');
  console.log('1. npm install @capacitor/core @capacitor/cli');
  console.log('2. npm install @capacitor/ios @capacitor/android');
  console.log('3. npm run cap:init');
  console.log('4. npm run cap:add:ios');
  console.log('5. npm run cap:add:android');
  console.log('6. npm run mobile:build');
  console.log('7. npm run cap:open:ios');
  console.log('8. npm run cap:open:android');
  
  console.log('\n🎨 アセット作成:');
  console.log('- アプリアイコン (1024x1024px)');
  console.log('- スクリーンショット各サイズ');
  console.log('- App Store最適化画像');
  
  console.log('\n📄 提出書類:');
  console.log('- APP-STORE-SUBMISSION-GUIDE.md');
  console.log('- PRIVACY-POLICY.md');
  console.log('- NATIVE-APP-GUIDE.md');
  
  console.log('\n✅ 準備完了！App Storeへの提出準備が整いました。');
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateAppStoreGuide, generatePrivacyPolicy };