const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback using Ethereal or test mock
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Email] Using Ethereal Mock SMTP: ${testAccount.user}`);
    } catch (e) {
      // Stream/console fallback
      transporter = {
        sendMail: async (opts) => {
          console.log('[Email Mock Sent]:', opts);
          return { messageId: 'mock-' + Date.now() };
        },
      };
    }
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: `"SphereOps SaaS" <${env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    if (nodemailer.getTestMessageUrl && info) {
      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        console.log(`[Email Preview URL]: ${testUrl}`);
      }
    }
    return info;
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error.message);
    return null;
  }
};

module.exports = { sendEmail };
