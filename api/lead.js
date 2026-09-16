import nodemailer from "nodemailer";

// Серверлес-функция Vercel: принимает заявку с сайта и отправляет письмо
// через SMTP российской почты (Яндекс 360 / VK WorkMail) на нужные адреса.
//
// Переменные окружения (задаются в Vercel → Project → Settings → Environment Variables):
//   SMTP_HOST  — например smtp.yandex.ru (по умолчанию) или smtp.mail.ru
//   SMTP_PORT  — 465 (SSL, по умолчанию)
//   SMTP_USER  — ящик-отправитель, напр. noreply@rsoing.ru
//   SMTP_PASS  — пароль приложения этого ящика (НЕ основной пароль)
//   LEAD_TO    — получатели через запятую, напр. recruiting@rsoing.ru,hr@rsoing.ru

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

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
    // Тело может прийти как объект (Vercel парсит JSON сам) или как строка
    const data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    // Собираем читаемые поля заявки (кроме служебных)
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
        const key = r.slice(0, i);
        const val = r.slice(i + 1).trim();
        return `<tr><td style="color:#888">${key}</td><td><b>${val}</b></td></tr>`;
      }).join("") +
      `</table>`;

    const port = Number(SMTP_PORT);
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // 465 = SSL, 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Сайт РСО Инжиниринг" <${SMTP_USER}>`,
      to: LEAD_TO.split(",").map((s) => s.trim()).filter(Boolean),
      subject,
      text,
      html,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err?.message || err) });
  }
}
