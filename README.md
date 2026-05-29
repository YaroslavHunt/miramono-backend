# MIRAMONO Dentistry — Backend API

REST API для сайту приватної стоматологічної практики **MIRAMONO Dentistry** (м. Львів):
презентаційна частина, онлайн-запис на прийом, каталог послуг із цінами, особистий кабінет
пацієнта, блог, відгуки, галерея «до/після», онлайн-оплата, мультимовність і адмін-панель для лікаря.

## Технології

- **Node.js 24**, **TypeScript 5.9**, **NestJS 11**
- **PostgreSQL 17** + **TypeORM 1.0** (міграції, `synchronize` вимкнено)
- **Redis 8** — кешування важких публічних відповідей (`@nestjs/cache-manager` + `@keyv/redis`)
- **JWT** (access + refresh, ротація) + **argon2**, RBAC (`PATIENT` / `DOCTOR` / `ADMIN`)
- **nestjs-i18n** — мультимовність (`uk` / `en`), переклади контенту в JSONB
- **LiqPay** (sandbox) — створення платежу + серверний callback з перевіркою підпису
- Swagger (OpenAPI), валідація запитів (`class-validator`), rate limiting, Helmet, CORS
- **Docker** / **docker-compose**

## Вимоги

- Node.js ≥ 20 (рекомендовано 24) та npm, або Docker + docker-compose.

## Швидкий старт

```bash
# 1. Встановити залежності
npm install

# 2. Підготувати змінні оточення
cp .env.example .env        # заповніть секрети (JWT_*_SECRET, ADMIN_*, LIQPAY_*)

# 3. Підняти PostgreSQL та Redis
npm run docker:db

# 4. Запустити застосунок у режимі розробки
npm run start:dev

# 5. (необов'язково) Засіяти демо-дані для наповнення сайту
npm run seed
```

Після старту:

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`
- Health-check: `http://localhost:3000/health`
- SEO: `http://localhost:3000/sitemap.xml`, `http://localhost:3000/robots.txt`

Адміністратор створюється автоматично на старті зі змінних `ADMIN_LOGIN` / `ADMIN_PASSWORD`.

### Запуск усього в контейнерах

```bash
npm run docker:up      # збірка та запуск app + postgres + redis
npm run docker:logs    # логи застосунку
npm run docker:down    # зупинити (down:vol — зі скиданням даних)
```

## Корисні скрипти

| Скрипт | Призначення |
|--------|-------------|
| `npm run start:dev` | Запуск із автоперезавантаженням |
| `npm run build` / `start:prod` | Збірка у `dist/` / запуск зібраного |
| `npm run typecheck` | Перевірка типів (`tsc --noEmit`) |
| `npm run lint` / `lint:fix` | Перевірка/виправлення стилю коду |
| `npm test` / `test:e2e` | Юніт- та e2e-тести |
| `npm run seed` | Засіяти адміністратора та демо-дані (ідемпотентно) |
| `npm run migration:generate --name=Name` | Згенерувати міграцію зі змін у сутностях |
| `npm run migration:run` / `migration:revert` | Застосувати / відкотити міграції |
| `npm run docker:db` | Лише PostgreSQL + Redis |
| `npm run docker:up` / `docker:down` | Повний стек у Docker |

## Можливості та основні ендпойнти

Публічні ендпойнти на читання відкриті (`@Public`), адмінські CRUD — під `@Roles(ADMIN)`.
Усі бізнес-маршрути мають префікс `/api`; `health`, `sitemap.xml` і `robots.txt` — поза префіксом.

| Розділ | Ендпойнти (стисло) |
|--------|--------------------|
| Авторизація | `POST /api/auth/register`, `login`, `refresh`, `logout` |
| Кабінет | `GET/PATCH /api/users/me` |
| Каталог | `GET /api/service-categories`, `GET /api/services` (+ адмін CRUD) |
| Лікарі | `GET /api/doctors` (+ адмін CRUD) |
| Клініка | `GET /api/clinic-info`, `PUT` (адмін) |
| Записи | `POST /api/appointments` (гість або пацієнт), `GET /api/appointments/me`, адмін/лікар: список, статус |
| Консультації | `POST /api/consultation-requests` (+ адмін) |
| Блог | `GET /api/articles`, `GET /api/articles/:slug` (+ адмін CRUD); підтримка `?lang=` |
| Відгуки | `POST /api/reviews` (модерація), `GET /api/reviews` (+ адмін) |
| Галерея | `GET /api/gallery`, `GET /api/gallery/:id` (+ адмін CRUD) |
| Завантаження | `POST /api/uploads` (адмін, зображення), роздача статики на `/uploads` |
| Платежі | `POST /api/payments` (data+signature для віджета LiqPay), `POST /api/payments/liqpay-callback` (серверний колбек), адмін: список/перегляд |
| SEO | `GET /sitemap.xml`, `GET /robots.txt` |

### Мультимовність

Локаль визначається параметром `?lang=uk|en` або заголовком `Accept-Language`; фолбек — `uk`.
Повідомлення про помилки беруться зі словників `src/i18n/{uk,en}`. Перекладний контент (статті)
зберігається в JSONB-полі `translations` — за `?lang=en` повертається переклад, інакше базова версія.

### Онлайн-оплата (LiqPay)

`POST /api/payments` створює платіж і повертає `data` + `signature` для віджета LiqPay (підпис —
`base64(sha1(privateKey + data + privateKey))`). Після оплати LiqPay надсилає серверний колбек на
`POST /api/payments/liqpay-callback`; підпис перевіряється, статус платежу оновлюється. Ключі —
у `LIQPAY_PUBLIC_KEY` / `LIQPAY_PRIVATE_KEY` (режим пісочниці — `LIQPAY_SANDBOX=true`).

### Кешування

Найважчі публічні відповіді (інформація про клініку, списки каталогу, лікарів, опублікованих
статей, sitemap) кешуються в Redis (TTL у мілісекундах). Кеш списків інвалідується при адмінських
змінах через версіонування неймспейсу — ключ враховує параметри пагінації, тож сторінки не плутаються.

## Структура проєкту

```
src/
  main.ts            точка входу (helmet, CORS, валідація, статика, Swagger)
  app.module.ts      кореневий модуль
  config/            конфігурація та валідація змінних оточення
  common/            базова сутність, фільтри, гуарди, декоратори, кеш-сервіс
  database/          DataSource, стратегія іменування, міграції, сидери
  health/            health-check
  i18n/              словники повідомлень (uk, en)
  modules/           фічеві модулі (auth, users, catalog, doctors, clinic,
                     appointments, consultations, blog, reviews, gallery,
                     uploads, payments, seo)
test/                e2e-тести
```

## Конфігурація

Усі змінні оточення описані в `.env.example` (тримайте `.env` синхронним). Файл `.env` не комітиться.
Схема БД керується міграціями (`synchronize` вимкнено), які застосовуються автоматично під час старту
(`migrationsRun: true`).

## Ліцензія

Навчальний проєкт (дипломна робота).
