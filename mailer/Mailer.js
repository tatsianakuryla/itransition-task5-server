const nodemailer = require('nodemailer');

class Mailer {
    static #transporter;

    static #MAIL_CONTEXT = (name, activationUrl) => `
            <h1>Welcome, ${name}!</h1>
            <p>Thank you for registering. Please activate your account by clicking the link below:</p>
            <a href="${activationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                Activate Account
            </a>
            <p>Or copy this link: <a href="${activationUrl}">${activationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
        `

    static get transporter() {
        if (!this.#transporter) {
            const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
            if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
                throw new Error('SMTP env vars are missing (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)');
            }
            this.#transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: Number(SMTP_PORT || 587),
                secure: Number(SMTP_PORT) === 465,
                auth: { user: SMTP_USER, pass: SMTP_PASS },
            });
        }
        return this.#transporter;
    }

    static async verify() {
        return this.transporter.verify();
    }

    static async sendMail({ to, subject, html, text }) {
        const from = `"Support" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`;
        return this.transporter.sendMail({ from, to, subject, text, html });
    }

    static async sendActivationEmail(email, name, activationToken) {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const activationUrl = `${backendUrl}/users/activate/${activationToken}`;
        const html = this.#MAIL_CONTEXT(name, activationUrl);
        const text = `Welcome, ${name}! Please activate your account by visiting: ${activationUrl}`;
        
        return this.sendMail({
            to: email,
            subject: 'Activate your account',
            html,
            text,
        });
    }
}

module.exports = { Mailer };