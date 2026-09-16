// Единый Node-сервер для VPS: раздаёт собранный сайт (dist) и принимает заявки.
// Логика письма та же, что в api/lead.js (Vercel), только в виде обычного маршрута.
//
// Запуск на сервере:
//   npm install
//   npm run build
//   node server.js         (или через pm2 / systemd — см. DEPLOY-VPS.md)
//
// Переменные окружения (файл .env на сервере или systemd Environment=):
//   PORT       — порт сервера (по умолчанию 3000)
//   SMTP_HOST  — smtp.yandex.ru
//   SMTP_PORT  — 465
//   SMTP_USER  — noreply@rsoing.ru
//   SMTP_PASS  — пароль приложения Яндекса
//   LEAD_TO    — recruiting@rsoing.ru (несколько — через запятую)

import express from "express";
import nodemailer from "nodemailer";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

app.post("/api/lead", async (req, res) => {
  const {
    SMTP_HOST = "smtp.yandex.ru",
    SMTP_PORT = "465",
    SMTP_USER,
    SMTP_PASS,
    LEAD_TO,
  } = process.env;

  if (!SMTP_USER || !SMTP_PASS || !LEAD_TO) {
    res.status(500).json({ success: false, error: "SMTP is not configured" });
    return;
  }

  try {
    const data = req.body || {};
    const skip = new Set(["subject", "from_name"]);
    const rows = Object.entries(data)
      .filter(([k, v]) => !skip.has(k) && v != null && String(v).trim() !== "")
      .map(([k, v]) => `${k}: ${v}`);

    const subject = data.subject || "Новая заявка с сайта РСО Инжиниринг";
    const text = ["Новая заявка с сайта РСО Инжиниринг:", "", ...rows].join("\n");
    const html =
      `<h2>Новая заявка с сайта РСО Инжиниринг</h2><table cellpadding="6">` +
      rows.map((r) => {
        const i = r.indexOf(":");
        return `<tr><td style="color:#888">${r.slice(0, i)}</td><td><b>${r.slice(i + 1).trim()}</b></td></tr>`;
      }).join("") +
      `</table>`;

    const port = Number(SMTP_PORT);
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Сайт РСО Инжиниринг" <${SMTP_USER}>`,
      to: LEAD_TO.split(",").map((s) => s.trim()).filter(Boolean),
      subject,
      text,
      html,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err?.message || err) });
  }
});

// Статика собранного сайта
const distDir = join(__dirname, "dist");
app.use(express.static(distDir));
// SPA-фолбэк: любой не-API маршрут отдаёт index.html
app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(distDir, "index.html")));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`RSO server on http://127.0.0.1:${PORT}`));
