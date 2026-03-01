const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

const emailService = {
  async sendEmail({ to, subject, html, text }) {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      text,
    });
    return info;
  },
};

module.exports = emailService;
