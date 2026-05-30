# Mogu API

NestJS で作成した Mogu のバックエンド API です。

## 開発

```bash
npm install
npm run start:dev
```

標準では `http://localhost:3000` で起動します。

## 環境変数

`.env.example` をコピーして `.env` を作成します。

```bash
cp .env.example .env
```

```env
GOOGLE_PLACES_API_KEY=your_api_key_here
DATABASE_URL="mysql://mogu:mogu_password@127.0.0.1:3306/mogu"
SHADOW_DATABASE_URL="mysql://root:root_password@127.0.0.1:3306/mogu_shadow"
JWT_SECRET="replace_with_a_long_random_secret"
RECAPTCHA_SECRET_KEY="your_recaptcha_secret_key"
RECAPTCHA_MIN_SCORE="0.5"
```

## MySQL / Prisma

ローカルDBは Docker Compose の MySQL を使います。

```bash
npm run db:up
npm run prisma:migrate -- --name init
npm run start:dev
```

既存データがあるローカルDBへ認証を追加した場合、migration で開発用ユーザーが作成されます。

```txt
email: local@example.com
password: password123
```

Prisma Client だけ再生成する場合:

```bash
npm run prisma:generate
```

## Google Places API 設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成、または既存プロジェクトを選択します。
2. プロジェクトに請求先アカウントを紐づけます。
3. Google Maps Platform の API ライブラリで `Places API` を有効化します。
4. `認証情報` から API キーを作成します。
5. 作成したキーの `API restrictions` を `Places API` のみに制限します。
6. 本番環境では `Application restrictions` をサーバーの IP アドレスに制限します。ローカル開発中だけ一時的に未制限で使えます。
7. API キーを `back/.env` の `GOOGLE_PLACES_API_KEY` に設定します。

## Google reCAPTCHA v3 設定

1. [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/create) を開きます。
2. Label に `Band Meshi Local` など分かる名前を入れます。
3. reCAPTCHA type は `reCAPTCHA v3` を選びます。
4. Domains にローカル用として `localhost` と `127.0.0.1` を追加します。本番では実ドメインも追加します。
5. 作成後に表示される `Site Key` を `front/.env.local` の `VITE_RECAPTCHA_SITE_KEY` に設定します。
6. `Secret Key` を `back/.env` の `RECAPTCHA_SECRET_KEY` に設定します。
7. `RECAPTCHA_MIN_SCORE` は最初は `0.5` のままにして、運用後に Admin Console のスコア分布を見て調整します。

## API

### 店舗検索

```http
GET /restaurants/search?q=渋谷 カフェ
Authorization: Bearer <access_token>
```

Google Places API の Text Search を使い、以下の形で返します。

```json
[
  {
    "id": "places/...",
    "name": "店舗名",
    "address": "住所",
    "category": "カテゴリ"
  }
]
```

### 登録済み店舗一覧

```http
GET /restaurants
Authorization: Bearer <access_token>
```

### 店舗登録・更新

```http
POST /restaurants
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "id": "places/...",
  "name": "店舗名",
  "photo": "https://...",
  "status": "visited",
  "rating": 4,
  "visitDate": "2026-05-30",
  "memo": "",
  "floor": "1F",
  "elevator": "unknown",
  "category": "カフェ",
  "address": "東京都..."
}
```

## 認証

### 新規登録

```http
POST /auth/register
Content-Type: application/json

{
  "email": "you@example.com",
  "password": "password123",
  "name": "表示名",
  "recaptchaToken": "token_from_grecaptcha_execute"
}
```

### ログイン

```http
POST /auth/login
Content-Type: application/json

{
  "email": "you@example.com",
  "password": "password123",
  "recaptchaToken": "token_from_grecaptcha_execute"
}
```

レスポンスの `accessToken` を `Authorization: Bearer <accessToken>` として認証が必要なAPIに付けます。

## 検証

```bash
npm run build
npm test -- --runInBand
```
