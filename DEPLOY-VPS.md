# Деплой на VPS (Ubuntu 22/24) + домен + Яндекс 360

Инструкция для переезда с Vercel на собственный сервер. Сайт и приём заявок
крутит один Node-процесс (`server.js`), спереди — nginx с HTTPS.

## 0. Что нужно заранее
- VPS (Ubuntu 22.04/24.04), root/sudo-доступ, публичный IP.
- Купленный домен (напр. `rsoing.ru`).
- Ящик Яндекс 360 (напр. `noreply@rsoing.ru`) и его **пароль приложения**
  (Яндекс ID → Безопасность → Пароли приложений → «Почта»). Основной пароль по SMTP не работает.

## 1. Домен → сервер
В панели регистратора добавь A-запись:
```
@    A    <IP сервера>
www  A    <IP сервера>
```
Подожди, пока прорастёт DNS (обычно минуты–часы).

## 2. Установка окружения на сервере
```bash
sudo apt update && sudo apt install -y nginx git curl
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

## 3. Код и сборка
```bash
cd /var/www
sudo git clone https://github.com/ykvlev/rso-inzh.git
sudo chown -R $USER:$USER rso-inzh
cd rso-inzh
npm install
npm run build          # соберёт папку dist
```

## 4. Секреты (.env)
Создай файл `/var/www/rso-inzh/.env` (он в .gitignore, в репозиторий не попадёт):
```
PORT=3000
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=noreply@rsoing.ru
SMTP_PASS=<пароль приложения Яндекса>
LEAD_TO=recruiting@rsoing.ru
```
Несколько получателей: `LEAD_TO=recruiting@rsoing.ru,hr@rsoing.ru`

## 5. Запуск через pm2 (автозапуск при перезагрузке)
pm2 не читает .env сам — подгружаем через `--env` невозможно, поэтому используем dotenv-подход:
```bash
# подхватываем переменные из .env и стартуем
set -a && . ./.env && set +a
pm2 start server.js --name rso --update-env
pm2 save
pm2 startup      # выполни команду, которую он подскажет
```

## 6. nginx как reverse-proxy
`sudo nano /etc/nginx/sites-available/rso`:
```nginx
server {
    listen 80;
    server_name rsoing.ru www.rsoing.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/rso /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. HTTPS (бесплатный сертификат Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d rsoing.ru -d www.rsoing.ru
```
Certbot сам пропишет 443 и редирект с http на https. Автопродление уже настроено.

## 8. Проверка
- Открой https://rsoing.ru — сайт грузится.
- Отправь тестовую заявку — письмо приходит на recruiting@rsoing.ru.
- Логи сервера: `pm2 logs rso`

## Обновление сайта в будущем
```bash
cd /var/www/rso-inzh
git pull
npm install
npm run build
pm2 restart rso
```
