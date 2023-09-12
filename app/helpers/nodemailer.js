const nodemailer = require('nodemailer')

const sendEmailFn = async (to, subject, text) => {

    // console.log('inside send', process.env) // can access process.env in any file without importing it
    const transporter = nodemailer.createTransport({
        service: 'hotmail', 
        auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.SENDER_PASSWORD,
        },
    });

    const mailOptions = { // can use es6 concise property
        from: process.env.SENDER_EMAIL,
        to: to,
        subject: subject,
        text: text
    };

    try{
        const emailInfo = await transporter.sendMail(mailOptions)
        // console.log('emailInfo', emailInfo)
        // console.log(typeof emailInfo) /// object


        console.log('Email sent:', emailInfo.response + ' ---> ' + mailOptions.to + '--->' + mailOptions.subject + '...' + mailOptions.text)
    } 
    catch (error) {
        console.error('Error in sending email:', error);
    }
}

module.exports = sendEmailFn