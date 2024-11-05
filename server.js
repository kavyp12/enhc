// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Routes to serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify email configuration
transporter.verify((error) => {
    if (error) {
        console.log('Error with email transporter:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Contact form endpoint
app.post('/send-email', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const mailOptions = {
            from: `"${name} via Contact Form" <${process.env.EMAIL_USER}>`,
            to: process.env.FIRM_EMAIL,
            subject: `New Contact Form Submission: ${subject}`,
            text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `,
            replyTo: email
        };

        await transporter.sendMail(mailOptions);
        console.log('Contact email sent successfully');
        res.status(200).json({ message: 'Thank you! Your message has been sent successfully.' });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ message: 'Error sending email. Please try again later.' });
    }
});

// Newsletter subscription endpoint
app.post('/subscribe-newsletter', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        // Send welcome email to subscriber
        const subscriberMailOptions = {
            from: `"enhancemodel.ai" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to enhancemodel.ai Newsletter!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Thank you for subscribing!</h2>
                    <p>Welcome to enhancemodel.ai's newsletter. You've successfully subscribed to receive our latest updates, insights, and offers.</p>
                    <p>Stay tuned for exciting content coming your way!</p>
                    <p>Best regards,<br>The enhancemodel.ai Team</p>
                </div>
            `
        };

        // Send notification to company
        const firmMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.FIRM_EMAIL,
            subject: 'New Newsletter Subscription',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>New Newsletter Subscriber</h2>
                    <p>A new user has subscribed to the newsletter:</p>
                    <p>Email: ${email}</p>
                    <p>Date: ${new Date().toLocaleString()}</p>
                </div>
            `
        };

        // Send both emails
        await transporter.sendMail(subscriberMailOptions);
        await transporter.sendMail(firmMailOptions);

        console.log('Newsletter subscription processed successfully');
        res.status(200).json({ message: 'Thank you for subscribing to our newsletter!' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ message: 'Error subscribing to newsletter. Please try again later.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
