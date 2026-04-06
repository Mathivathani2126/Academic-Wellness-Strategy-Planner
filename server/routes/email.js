import express from 'express';
import nodemailer from 'nodemailer';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Configure Nodemailer transporter (User will input Gmail credentials in .env)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send Report to user
router.post('/report', authMiddleware, async (req, res) => {
    try {
        const { pdfDataUrl, subject } = req.body;
        const userEmail = req.user.email;

        if (!pdfDataUrl) return res.status(400).json({ error: "No PDF data provided" });

        // Convert base64 to buffer
        const base64Data = pdfDataUrl.replace(/^data:application\/pdf;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: subject || 'Your Wellness Strategy Report',
            text: 'Hello, \\n\\nPlease find your generated Academic Wellness Strategy report attached.\\n\\nBest,\\nWellNex Team',
            attachments: [
                {
                    filename: 'Strategy_Report.pdf',
                    content: buffer
                }
            ]
        };

        if(process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: 'Email sent successfully!' });
        } else {
            console.warn("Email credentials not configured in .env. Faking success.");
            res.status(200).json({ message: 'Email credentials not set. Simulated success.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

export default router;
