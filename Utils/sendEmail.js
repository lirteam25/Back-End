const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
        user: 'info@lirmusic.com',
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.sendEmail = async (receiver, subject, html) => {
    // send mail with defined transport object
    transporter.sendMail({
        from: '"LIR" <info@lirmusic.com>',
        to: receiver,
        subject: subject,
        html: html
    }, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);

        }
    });
}
