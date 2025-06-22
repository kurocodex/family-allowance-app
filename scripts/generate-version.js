#!/usr/bin/env node

// バージョン情報ファイルを自動生成
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function generateVersionInfo() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
  );
  
  const buildTime = Date.now();
  const version = packageJson.version || '1.0.0';
  
  // ビルドハッシュを生成（ファイル内容ベース）
  const buildHash = crypto
    .createHash('md5')
    .update(`${version}-${buildTime}`)
    .digest('hex')
    .substring(0, 8);
  
  const distPath = path.join(__dirname, '../dist');
  const assets = [];
  
  // distフォルダが存在する場合、アセットファイル一覧を取得
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(path.join(distPath, 'assets'), { recursive: true });
    assets.push(...files.filter(file => typeof file === 'string'));
  }
  
  const versionInfo = {
    version: `${version}-${buildHash}`,
    buildTime,
    buildDate: new Date(buildTime).toISOString(),
    assets,
    commitHash: process.env.VERCEL_GIT_COMMIT_SHA || 'development'
  };
  
  // public/version.json に書き出し
  const publicVersionPath = path.join(__dirname, '../public/version.json');
  fs.writeFileSync(publicVersionPath, JSON.stringify(versionInfo, null, 2));
  
  // dist/version.json にも書き出し（ビルド後用）
  if (fs.existsSync(distPath)) {
    const distVersionPath = path.join(distPath, 'version.json');
    fs.writeFileSync(distVersionPath, JSON.stringify(versionInfo, null, 2));
  }
  
  console.log(`✅ Version info generated: ${versionInfo.version}`);
  console.log(`   Build time: ${versionInfo.buildDate}`);
  console.log(`   Assets: ${assets.length} files`);
  
  return versionInfo;
}

// スクリプトとして実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  generateVersionInfo();
}

export { generateVersionInfo };