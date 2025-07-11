
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend server is running' });
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { smtpConfig, emailData } = req.body;

    // Validate required fields
    if (!smtpConfig || !emailData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing smtpConfig or emailData' 
      });
    }

    if (!smtpConfig.auth || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing email credentials' 
      });
    }

    // Create transporter with user's SMTP settings
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure, // true for 465, false for other ports
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass
      },
      // Additional security options
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: `"${emailData.fromName || 'Invoice System'}" <${emailData.from}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html?.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });

    console.log('Email sent successfully:', info.messageId);

    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    let errorMessage = 'Failed to send email';
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email and password/app password.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'SMTP server not found. Please check your SMTP settings.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Please check your network and SMTP settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

// Test email configuration endpoint
app.post('/api/test-email-config', async (req, res) => {
  try {
    const { smtpConfig } = req.body;

    if (!smtpConfig || !smtpConfig.auth) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing SMTP configuration' 
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Just verify the connection without sending
    await transporter.verify();

    res.json({ 
      success: true, 
      message: 'Email configuration is valid' 
    });

  } catch (error) {
    console.error('Email config test error:', error);
    
    let errorMessage = 'Email configuration test failed';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email and password/app password.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'SMTP server not found. Please check your SMTP settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
