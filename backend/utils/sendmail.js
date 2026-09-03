const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
    const emailUser = (process.env.EMAIL_USER || '').trim();
    const emailPass = (process.env.EMAIL_PASS || '').trim();

    if (!emailUser || !emailPass) {
        const errorMessage = 'EMAIL_USER or EMAIL_PASS is missing in .env';
        console.error(`[Email] Failed: ${errorMessage}. Recipient: ${to}. Subject: ${subject}`);
        return { success: false, error: errorMessage };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT || 587),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: emailUser,
                pass: emailPass
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });

        await transporter.sendMail({
            from: `"TapMart" <${emailUser}>`,
            to,
            subject,
            text
        });

        console.log(`Email successfully sent to ${to} (${subject})`);
        return { success: true };
    } catch (error) {
        console.error(`[Email] Failed to send. Recipient: ${to}. Subject: ${subject}`);
        console.error(`[Email] Reason: ${error.message}`);
        if (error.code) console.error(`[Email] Code: ${error.code}`);
        if (error.response) console.error(`[Email] Provider response: ${error.response}`);
        if (error.command) console.error(`[Email] SMTP command: ${error.command}`);
        return { success: false, error: error.message, code: error.code };
    }
};

module.exports = sendEmail;