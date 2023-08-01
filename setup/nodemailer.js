const nodemailer = require("nodemailer");
nodemailer.createTestAccount();
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SYSTEM_USER,
    pass: process.env.EMAIL_SYSTEM_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 9000,
});

module.exports = {
  transporter,
};
