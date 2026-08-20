const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { authenticateJWT } = require('../middleware/auth');
const { sendEmail } = require('../config/mail');

const JWT_SECRET = process.env.JWT_SECRET || 'society_management_super_secret_key_12345';

// Helper: Generate 6-digit numeric OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Send OTP Email
async function sendOTPEmail(email, name, otp) {
  const subject = `Your Staywise Verification Code: ${otp}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1f2937; max-width: 540px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #249D8F; margin: 0; font-size: 24px; font-weight: 800;">Staywise Portal</h2>
        <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Smart Apartment & Society Management</p>
      </div>
      <h3 style="color: #111827; font-size: 18px; margin-bottom: 8px;">Verify Your Email Address</h3>
      <p>Hello <strong>${name || 'Resident'}</strong>,</p>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">
        Thank you for registering on Staywise. Please use the 6-digit verification code below to verify your email address and activate your account:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #249D8F; background-color: #f0fdf4; padding: 14px 28px; border-radius: 12px; border: 1px dashed #249D8F; display: inline-block;">
          ${otp}
        </span>
      </div>
      <p style="color: #6b7280; font-size: 13px; text-align: center;">This code will expire in 15 minutes.</p>
      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">If you did not request this code, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, societyName, apartmentName, flatNumber, phoneNumber, occupancyType } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: 'Email is already registered' });
      } else {
        // Unverified user registering again - regenerate OTP and update
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        const hashedPassword = await bcrypt.hash(password, 10);
        const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'RESIDENT';

        await prisma.user.update({
          where: { email },
          data: {
            name,
            password: hashedPassword,
            role: assignedRole,
            societyName: societyName || null,
            apartmentName: apartmentName || null,
            flatNumber: flatNumber || null,
            phoneNumber: phoneNumber || null,
            occupancyType: occupancyType || 'OWNER',
            verificationOTP: otp,
            otpExpiresAt,
          }
        });

        await sendOTPEmail(email, name, otp);

        return res.status(200).json({
          requiresVerification: true,
          email,
          message: 'Verification code sent to your email address.'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'RESIDENT';
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
        societyName: societyName || null,
        apartmentName: apartmentName || null,
        flatNumber: flatNumber || null,
        phoneNumber: phoneNumber || null,
        occupancyType: occupancyType || 'OWNER',
        isVerified: false,
        verificationOTP: otp,
        otpExpiresAt,
      },
    });

    // Send verification email async
    sendOTPEmail(email, name, otp).catch(err => console.error('Error sending OTP:', err));

    res.status(201).json({
      requiresVerification: true,
      email: user.email,
      message: 'Registration successful! A 6-digit verification code has been sent to your email.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification OTP code are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (user.isVerified) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: '7d',
      });
      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          societyName: user.societyName,
          apartmentName: user.apartmentName,
          flatNumber: user.flatNumber,
          phoneNumber: user.phoneNumber,
          occupancyType: user.occupancyType,
          isVerified: user.isVerified,
        }
      });
    }

    if (user.verificationOTP !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Mark user as verified
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationOTP: null,
        otpExpiresAt: null,
      }
    });

    const token = jwt.sign({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        societyName: updatedUser.societyName,
        apartmentName: updatedUser.apartmentName,
        flatNumber: updatedUser.flatNumber,
        phoneNumber: updatedUser.phoneNumber,
        occupancyType: updatedUser.occupancyType,
        isVerified: updatedUser.isVerified,
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify code.' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'This email account is already verified.' });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        verificationOTP: otp,
        otpExpiresAt,
      }
    });

    await sendOTPEmail(email, user.name, otp);

    res.json({ message: 'A new 6-digit verification code has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend verification code.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      // Unverified email: regenerate code & require OTP entry
      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { email },
        data: { verificationOTP: otp, otpExpiresAt }
      });

      sendOTPEmail(email, user.name, otp).catch(err => console.error('Error sending OTP:', err));

      return res.status(403).json({
        requiresVerification: true,
        email: user.email,
        error: 'Email address not verified yet. A 6-digit verification code has been sent to your email.'
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyName: user.societyName,
        apartmentName: user.apartmentName,
        flatNumber: user.flatNumber,
        phoneNumber: user.phoneNumber,
        occupancyType: user.occupancyType,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
