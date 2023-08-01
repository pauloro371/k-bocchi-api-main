const { transporter } = require("../../setup/nodemailer");
const nodemailer = require("nodemailer");
let sender = process.env.EMAIL_SYSTEM_USER;
async function enviarEmail(html,emailTo,subject) {
  let info = await transporter.sendMail({
    from: `"Kbocchi team 👨‍👨‍👧‍👦" <${sender}>`,
    to: emailTo,
    subject: subject,
    html: html,
  });
  console.log("Message sent: %s", info.messageId);
  //   console.log("Message sent: %s", nodemailer.);
}

// enviarEmail().catch(console.error);

const renderEmailMiddleware = (req, res, next) => {
  res.render(res.htmlTemplate, { ...res.emailContent }, (err,html)=>{
    if(err){
        console.log(err);
        return res.status(500).json("Algo ha salido mal, intenta más tarde")
    }
    res.htmlRendered = html;
    next();
  });
};

module.exports = {
  renderEmailMiddleware,
  enviarEmail
};
