# Деплой — РСО Инжиниринг

Проект: **Vite + React + Tailwind**. Уже закоммичен в git (ветка `main`).

## 1. Запушить на GitHub

`gh` не установлен, поэтому создай репозиторий вручную:

1. Зайди на https://github.com/new → создай **пустой** репозиторий (без README/.gitignore), например `rso-inzh`.
2. В папке проекта выполни (подставь свой логин):

```bash
git remote add origin https://github.com/ТВОЙ_ЛОГИН/rso-inzh.git
git push -u origin main
```

Если попросит логин — введи GitHub-логин и **токен** (Settings → Developer settings → Personal access tokens) вместо пароля.

## 2. Задеплоить на Vercel

1. https://vercel.com → **Add New → Project** → Import твой GitHub-репозиторий.
2. Vercel сам определит Vite (настройки уже заданы в `vercel.json`):
   - Framework: **Vite**
   - Build: `npm run build`
   - Output: `dist`
3. Нажми **Deploy**. Через ~1 мин будет ссылка вида `rso-inzh.vercel.app`.

Дальше каждый `git push` в `main` = автоматический передеплой.

## 3. Приём заявок на почту (Web3Forms)

Чтобы номера с формы приходили на почту:

1. https://web3forms.com → введи рабочую почту → получишь **Access Key**.
2. В файле `src/imports/Desktop2/index.tsx` замени:
   ```js
   const WEB3FORMS_ACCESS_KEY = "YOUR_ACCESS_KEY";
   ```
   на свой ключ.
3. `git commit -am "web3forms key" && git push` — Vercel передеплоит.

## Локальный запуск

```bash
npm install
npm run dev
```
