# РСО Инжиниринг — сайт

Проект: **Vite + React + Tailwind**. Приём заявок — свой Node-сервер
(`server.js`), письма уходят через SMTP Яндекс 360.

## Локальная разработка

```bash
npm install
npm run dev
```

## Локальная проверка «как на сервере»

```bash
npm run build     # собрать сайт в dist/
npm start         # поднять server.js (сайт + приём заявок) на :3000
```
Приём заявок при этом требует переменных SMTP (см. ниже) — иначе `/api/lead`
вернёт ошибку «SMTP is not configured», а сам сайт работает.

## Продакшн (VPS + домен + HTTPS)

Полная пошаговая инструкция — в **[DEPLOY-VPS.md](DEPLOY-VPS.md)**:
Ubuntu → Node → сборка → pm2 → nginx → Let's Encrypt → Яндекс 360.

## Приём заявок

Обе формы (телефон в футере + модалка «оставить заявку») шлют POST на `/api/lead`.
Сервер отправляет письмо через SMTP на адреса из `LEAD_TO`.

Переменные окружения (файл `.env` на сервере, он в `.gitignore`):

```
PORT=3000
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=recruiting@rsoing.ru
SMTP_PASS=<пароль приложения Яндекса>
LEAD_TO=recruiting@rsoing.ru
```

- `SMTP_PASS` — **пароль приложения** Яндекса (Яндекс ID → Безопасность →
  Пароли приложений → «Почта»), не обычный пароль от ящика.
- Несколько получателей: `LEAD_TO=recruiting@rsoing.ru,hr@rsoing.ru`
