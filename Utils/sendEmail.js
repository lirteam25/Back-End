const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
        user: 'info@lirmusic.com',
        pass: "BRtBhncq%88PH(w"
    }
});

exports.sendEmail = async (receiver, subject, html, pdfBuffer) => {

    const attachments = [];

    if (pdfBuffer) {
        const currentDate = new Date();
        const currentDateFormattedDate = currentDate.toLocaleDateString('en-US').replace(/\//g, '-');
        attachments.push({
            filename: `${currentDateFormattedDate}-LIRReport.pdf`,
            content: pdfBuffer,
            encoding: 'base64',
        });
    }

    // send mail with defined transport object
    transporter.sendMail({
        from: '"LIR" <info@lirmusic.com>',
        to: receiver,
        subject: subject,
        html: html,
        attachments: attachments,
    }, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);

        }
    });
}
