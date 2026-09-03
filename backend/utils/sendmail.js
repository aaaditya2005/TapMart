const nodemailer = require('nodemailer');

const sendWithBrevo = async (to, subject, text, apiKey, senderEmail, senderName) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: { email: senderEmail, name: senderName },
            to: [{ email: to }],
            subject,
            textContent: text
        })
    });

    if (!response.ok) {
        const providerError = await response.text();
        const error = new Error(`Brevo API ${response.status}: ${providerError}`);
        error.code = `BREVO_${response.status}`;
        throw error;
    }
};

const sendEmail = async (to, subject, text) => {
    const emailUser = (process.env.EMAIL_USER || '').trim();
    const emailPass = (process.env.EMAIL_PASS || '').trim();
    const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
    const senderEmail = (process.env.EMAIL_FROM || emailUser).trim();
    const senderName = (process.env.EMAIL_FROM_NAME || 'TapMart').trim();

    if (!brevoApiKey && (!emailUser || !emailPass)) {
        const errorMessage = 'Configure BREVO_API_KEY or both EMAIL_USER and EMAIL_PASS';
        console.error(`[Email] Failed: ${errorMessage}. Recipient: ${to}. Subject: ${subject}`);
        return { success: false, error: errorMessage };
    }

    try {
        if (brevoApiKey) {
            await sendWithBrevo(to, subject, text, brevoApiKey, senderEmail, senderName);
            console.log(`Email successfully sent with Brevo to ${to} (${subject})`);
            return { success: true };
        }

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
            from: `"${senderName}" <${emailUser}>`,
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