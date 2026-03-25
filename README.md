# Trading Reminder Bot (NestJS + Prisma)

Бот забирает экономический календарь из JSON URL, применяет фильтры из `.env`, сохраняет события в SQLite (через Prisma) и отправляет уведомления в Telegram:

- ежедневный отчёт по подходящим событиям на текущий день;
- напоминание за 15 минут до события;
- синхронизация календаря каждые 60 секунд.

## Стек

- NestJS
- `@nestjs/schedule` (cron каждую минуту)
- Prisma + SQLite
- Telegram Bot API

## ENV переменные

```env
PORT=3000
DATABASE_URL="file:./dev.db"

TELEGRAM_TOKEN=123456:ABCDEF
TELEGRAM_CHAT_ID=123456789

TIMEZONE=Europe/Moscow
DAILY_REPORT_TIME=08:00
CALENDAR_URL=https://example.com/weekly-calendar.json

# CSV списки (необязательные)
FILTER_COUNTRIES=US,EU,GB
FILTER_IMPACTS=high,medium
FILTER_INCLUDE_KEYWORDS=CPI,NFP,Rate
FILTER_EXCLUDE_KEYWORDS=auction
```

## Ожидаемый JSON формат

Поддерживаются форматы:
- массив событий: `[{...}, {...}]`
- объект с массивом в одном из полей: `events`, `data`, `results`, `calendar`

Для каждого события бот пытается читать поля:

- `title` (или `event` / `name`)
- `country`
- `impact`
- `dateUtc` (или `datetime` / `date`)
- `forecast` (опционально)
- `previous` (опционально)
- `id` (опционально; если нет — генерируется детерминированный ключ)

## Prisma

```bash
npx prisma migrate dev --name add_calendar_sync_fields
npx prisma generate
```

## Запуск

```bash
npm install
npm run start:dev
```

## Как работает cron

Каждую минуту (`EVERY_MINUTE`) выполняются шаги:

1. Sync календаря (upsert по `externalId`).
2. Отправка daily отчёта строго в `DAILY_REPORT_TIME` в `TIMEZONE`.
3. Отправка reminder для событий, которые начнутся в окне `[now + 14m, now + 15m)`.

## Endpoint

- `GET /health` — health-check.
