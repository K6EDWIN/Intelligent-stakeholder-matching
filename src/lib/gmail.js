import nodemailer from "nodemailer";

export const GMAIL_SENDER = process.env.GMAIL_USER || "strathtank@gmail.com";

function createMailer() {
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!appPassword) {
    throw new Error("Gmail delivery is not configured. Add GMAIL_APP_PASSWORD to the deployment environment.");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_SENDER, pass: appPassword },
  });
}

export async function sendAppEmail({ to, subject, html, text }) {
  const mailer = createMailer();
  return mailer.sendMail({
    from: `KQ PrideConnect <${GMAIL_SENDER}>`,
    to,
    subject,
    html,
    text,
  });
}
