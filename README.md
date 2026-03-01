# server-pattern-no-controllers

Express.js backend паттерн без контроллерів на основі **Vertical Slice Architecture** — один файл = один роут = один зріз логіки.

## Концепція

Замість горизонтальних шарів (`controllers/` → `services/` → `repositories/`) — вертикальні зрізи по операціях. Кожен роут-файл знає про свою одну операцію і напряму викликає сервіси з `shared/`.

```
Не так:                          А так:
controllers/                     routes/api/
  UserController.js                auth/login.js       ← зріз 1
  GoodsController.js               auth/register.js    ← зріз 2
services/                          user/profile/get.js ← зріз 3
  UserService.js                   admin/users/getAll  ← зріз 4
```

Сервіс = атомарна операція з однією моделлю. Оркестрація кількох сервісів — прямо у файлі роуту. Якщо та сама оркестрація потрібна і в API і в боті — виносиш в `shared/services/`.

---

## Структура

```
├── app/                              # Express-специфічний код
│   ├── createExpressApp.js           # Фабрика Express додатку
│   ├── middlewares/
│   │   ├── auth.js                   # Перевірка JWT токену
│   │   └── admin.js                  # Перевірка ролі адміна
│   └── routes/
│       ├── createApiRouter.js        # Автолоад роутів + призначення мідлварів по папкам
│       └── api/
│           ├── auth/                 # Публічні — без мідлвару
│           │   ├── login.js          # POST /api/auth/login
│           │   ├── logout.js         # POST /api/auth/logout
│           │   ├── refresh.js        # POST /api/auth/refresh
│           │   └── register.js       # POST /api/auth/register
│           ├── user/                 # auth мідлвар
│           │   ├── profile/
│           │   │   ├── get.js        # GET  /api/user/profile
│           │   │   └── update.js     # PATCH /api/user/profile
│           │   └── projects/
│           │       ├── getAll.js     # GET  /api/user/projects
│           │       └── getOne.js     # GET  /api/user/projects/:id
│           └── admin/                # auth + admin мідлвар
│               ├── users/
│               │   ├── getAll.js     # GET    /api/admin/users
│               │   ├── getOne.js     # GET    /api/admin/users/:id
│               │   ├── update.js     # PATCH  /api/admin/users/:id
│               │   └── delete.js     # DELETE /api/admin/users/:id
│               └── stats/
│                   └── overview.js   # GET /api/admin/stats
│
├── bot/                              # Telegram бот (опціонально)
│   ├── createBot.js
│   └── commands/                     # Команди — такі ж тонкі зрізи як роути
│       └── auth/                     # Імпортують ті ж сервіси з shared/
│
├── server/                           # Точка входу API сервера
│   ├── server.js
│   └── createLogger.js               # Pino logger (pretty в dev, JSON в prod)
│
├── server-cron/                      # Точка входу крон процесу
│   ├── server-cron.js
│   └── handlers/                     # Кожен файл = один крон джоб
│       └── updateUserNightly.js      # { schedule, name, handler }
│
├── shared/                           # Все що шериться між app/, bot/, cron/
│   ├── database/
│   │   ├── createDatabase.js         # Підключення mongoose + singleton getDatabase()
│   │   └── schemas/                  # Mongoose схеми
│   │       ├── User.js
│   │       └── Tokens.js
│   ├── errors/
│   │   └── ApiError.js               # Типізовані HTTP помилки
│   ├── middlewares/
│   │   ├── errorHandler.js           # Центральний обробник помилок
│   │   └── validate.js               # Zod валідація: validate(schema)
│   ├── services/                     # Атомарні операції з моделями
│   │   ├── user.service.js
│   │   ├── auth.service.js
│   │   ├── token.service.js
│   │   └── email.service.js
│   ├── validators/
│   │   └── fields.js                 # Базові Zod поля (email, password, mongoId...)
│   ├── lib/                          # Обгортки над зовнішніми лібами (geo, sms, s3...)
│   └── utils/                        # Чисті хелпери без залежностей (date, string...)
│
├── .env.example
├── jsconfig.json                     # Path aliases: @/ → ./
└── package.json
```

---

## Процеси

Кожен процес запускається незалежно і має свій healthcheck порт.

| Процес | Файл | Порт | Опис |
|--------|------|------|------|
| API сервер | `server/server.js` | `8080` | HTTP API |
| Cron | `server-cron/server-cron.js` | `8081` | Заплановані задачі |
| Worker | `server-worker/server-worker.js` | `8082` | BullMQ черга |

---

## Запуск

```bash
npm install
cp .env.example .env   # заповни змінні
```

**Dev — всі процеси одразу:**
```bash
npm run dev
```

**Dev — окремо:**
```bash
npm run dev:api
npm run dev:cron
npm run dev:worker
```

**Prod:**
```bash
npm run start
npm run start:cron
npm run start:worker
```

---

## Мідлвари по роутах

Призначаються в `createExpressApp.js` по префіксу шляху — файли роутів про мідлвари не знають:

```js
app.use("/api/auth",  authRouter);            // без мідлвару
app.use("/api/user",  [auth], userRouter);    // тільки авторизовані
app.use("/api/admin", [auth, admin], adminRouter); // тільки адміни
```

---

## Валідація

Zod схема живе прямо у файлі роуту. Базові поля імпортуються з `shared/validators/fields.js`:

```js
const { z } = require("zod");
const { email, password } = require("@/shared/validators/fields");
const validate = require("@/shared/middlewares/validate");

const schema = z.object({
  body: z.object({ email, password }),
});

router.post("/login", validate(schema), async (req, res, next) => { ... });
```

Помилка валідації повертається як:
```json
{
  "error": {
    "status": 400,
    "message": "Validation failed",
    "errors": [{ "field": "body.email", "message": "Invalid email" }]
  }
}
```

---

## База даних

Singleton — ініціалізуєш один раз при старті, далі `getDatabase()` де завгодно:

```js
// server/server.js
const { createDatabase } = require("@/shared/database/createDatabase");
await createDatabase({ logger, mongoose: require("mongoose") });

// shared/services/user.service.js
const { getDatabase } = require("@/shared/database/createDatabase");
const db = getDatabase();
```

---

## Додати новий крон джоб

Створи файл в `server-cron/handlers/` і підключи в `server-cron.js`:

```js
// server-cron/handlers/sendReports.js
module.exports = (logger) => cron.schedule("0 9 * * 1", async () => {
  // логіка
}, { name: "send-reports" });

// server-cron/server-cron.js
const tasks = [
  require("./handlers/updateUserNightly")(logger),
  require("./handlers/sendReports")(logger),  // ← додав
];
```

---

## Path aliases

`@/` вказує на корінь проекту. Налаштовано в `jsconfig.json` для VS Code та через `module-alias` для Node.js.

```js
require("@/shared/services/user.service");   // замість ../../../shared/services/user.service
```

Перший рядок кожної точки входу:
```js
require("module-alias/register");
```

---

## Змінні середовища

| Змінна | Обов'язкова | Опис |
|--------|-------------|------|
| `PORT` | ✓ | Порт API сервера |
| `MONGODB_URL` | ✓ | URL MongoDB |
| `MONGODB_DB_NAME` | ✓ | Назва бази |
| `JWT_ACCESS_SECRET` | ✓ | Секрет access токену |
| `JWT_REFRESH_SECRET` | ✓ | Секрет refresh токену |
| `JWT_ACCESS_EXPIRES` | ✓ | Час життя access токену (напр. `15m`) |
| `JWT_REFRESH_EXPIRES` | ✓ | Час життя refresh токену (напр. `30d`) |
| `REDIS_HOST` | тільки з worker | Redis хост |
| `REDIS_PORT` | тільки з worker | Redis порт |
| `BULL_QUEUE_NAME` | тільки з worker | Назва черги |
| `CRON_PORT` | тільки з cron | Healthcheck порт крону |
| `SMTP_*` | тільки з поштою | SMTP налаштування |
| `LOG_LEVEL` | — | `debug`/`info`/`warn`/`error` (дефолт: `debug` в dev) |

`NODE_ENV` задається в скриптах `package.json` через `cross-env`, не в `.env`.

Згенерувати секрети:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```