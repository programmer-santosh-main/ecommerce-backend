// utils/sendEmail.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
  FROM_FORCE_SMTP_USER, // optional: "true" to force visible From to SMTP_USER for testing
  NODE_ENV,
} = process.env;

// -------------------------------
// ⭐ SMTP Transport (Zoho-ready)
// -------------------------------
let smtpTransporter = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  const portNum = Number(SMTP_PORT);
  const secureFlag = portNum === 465 || SMTP_SECURE === "true";

  smtpTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: portNum,
    secure: secureFlag, // true for 465, false for 587 (STARTTLS)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    requireTLS: !secureFlag,
    tls: {
      rejectUnauthorized: false, // set true in production if certs are OK
    },
    logger: NODE_ENV !== "production", // reduce logs in production
    debug: NODE_ENV !== "production",
  });

  smtpTransporter
    .verify()
    .then(() => console.log("📧 SMTP Ready"))
    .catch((err) => console.error("❌ SMTP verify failed:", err?.message || err));
} else {
  console.warn(
    "⚠️ SMTP not fully configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in .env"
  );
}

/**
 * sendEmail(to, subject, html, options)
 * - to: string or array
 * - subject: string
 * - html: string (HTML body)
 * - options (optional): { fromHeader } to override visible From header
 *
 * Returns nodemailer result object or null on failure.
 */
const sendEmail = async (to, subject, html, options = {}) => {
  if (!smtpTransporter) {
    console.warn("⚠️ No SMTP transporter available — email not sent.");
    return null;
  }

  // visible From header (what recipient sees). Prefer EMAIL_FROM, then options.fromHeader, then SMTP_USER
  let fromHeader = EMAIL_FROM || options.fromHeader || `no-reply@${SMTP_USER?.split("@")[1] || "example.com"}`;

  // If testing and you want the visible From to exactly match SMTP_USER, set FROM_FORCE_SMTP_USER=true in .env
  if (FROM_FORCE_SMTP_USER === "true") {
    fromHeader = SMTP_USER;
  }

  // Envelope FROM - MUST be the authenticated SMTP user or an allowed alias/domain in Zoho
  const envelopeFrom = SMTP_USER;

  // Normalize recipients
  const envelopeTo = Array.isArray(to) ? to.join(", ") : to;

  try {
    const info = await smtpTransporter.sendMail({
      from: fromHeader, // visible header
      to: envelopeTo,
      subject,
      html,
      envelope: {
        from: envelopeFrom, // SMTP MAIL FROM (prevents Zoho relay rejection)
        to: envelopeTo,
      },
    });

    console.log(`📧 SMTP: email sent to ${envelopeTo}`, info?.messageId || info);
    return info;
  } catch (err) {
    console.error("❌ SMTP send error:", err?.message || err);
    return null;
  }
};

export default sendEmail;
export { sendEmail };
