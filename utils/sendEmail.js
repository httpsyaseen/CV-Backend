import { createTransport } from "nodemailer";

const sendingEmail = async (options) => {
  let transporter = createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  let mailOptions = {
    from: `Yaseen ${process.env.EMAIL_USERNAME}`,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
};

export default sendingEmail;
