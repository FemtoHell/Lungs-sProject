require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const nodemailer = require('nodemailer');

const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

let globalMongoClient = null;
async function getMongoClient() {
  if (globalMongoClient && globalMongoClient.topology && globalMongoClient.topology.isConnected()) {
    return globalMongoClient;
  }
  globalMongoClient = await MongoClient.connect(MONGO_URI, { maxPoolSize: 20 });
  return globalMongoClient;
}

async function getDb() {
  const client = await getMongoClient();
  return client.db(DB_NAME);
}

async function sendVerificationEmail(to, code) { 
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your_gmail@gmail.com',
      pass: process.env.EMAIL_PASS || 'your_gmail_app_password'
    }
  });
  const link = `${process.env.PUBLIC_URL.replace(/\/$/, '')}/auth/verify?code=${code}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER || 'your_gmail@gmail.com',
    to,
    subject: 'Xác thực tài khoản',
    html: `<p>Chào bạn,<br>Vui lòng bấm vào link sau để xác thực tài khoản:</p><p><a href="${link}">${link}</a></p>`
  });
}

const router = express.Router();

function getRedis(req) {
  return req.app.get('redis');
}

router.get('/verify', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'Missing verification code' });
  try {
    const db = await getDb();
    const authentication = db.collection('authentication');
    const users = db.collection('users');
    const record = await authentication.findOne({ auth_code: code, type: 'verify', is_verified: false });
    if (!record) return res.status(400).json({ message: 'Invalid or expired verification code' });
    // Cập nhật user là đã active
    await users.updateOne({ _id: record.user_id }, { $set: { is_active: true } });
    await authentication.updateOne({ _id: record._id }, { $set: { is_verified: true, verified_at: new Date() } });
    res.json({ message: 'Account verified successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'lung_app';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Confirm password does not match password'
  }),
  is_superuser: Joi.boolean().optional(),
  is_staff: Joi.boolean().optional()
}).unknown(true);

router.post('/register', async (req, res) => { 
  const { captchaToken } = req.body;
  if (!captchaToken) {
    return res.status(400).json({ message: 'Missing captcha token' });
  }
  
  // Skip reCAPTCHA validation in development or when no secret is configured
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const hasRecaptchaSecret = process.env.RECAPTCHA_SECRET && process.env.RECAPTCHA_SECRET.trim() !== '';
  
  if (!isDevelopment && hasRecaptchaSecret) {
    try {
      const secret = process.env.RECAPTCHA_SECRET;
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${captchaToken}`;
      const verifyRes = await axios.post(verifyUrl, {}, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      const verifyData = verifyRes.data;
      if (!verifyData.success || verifyData.score < 0.5) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed', score: verifyData.score });
      }
    } catch (err) {
      return res.status(400).json({ message: 'reCAPTCHA validation error', error: err.message });
    }
  } else {
    console.log('⚠️  Skipping reCAPTCHA validation (development mode or no secret configured)');
  }

  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  const { email, password, is_superuser = false, is_staff = false } = value;
  try {
    const db = await getDb();
    const users = db.collection('users');
    const authentication = db.collection('authentication');
    const redis = getRedis(req); 
    let existing = null;
    const cacheKey = `user:${email}`;
    
    // Clear cache first
    await redis.del(cacheKey);
    
    existing = await users.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already exists' });
    
    const hash = await bcrypt.hash(password, 10);
    const user = {
      email,
      password: hash,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: false,
      is_superuser: !!is_superuser,
      is_staff: !!is_staff,
      roles: [],
      extra_permissions: []
    };
    const result = await users.insertOne(user);
    const auth_code = Math.random().toString(36).substring(2, 10) + Date.now();
    await authentication.insertOne({
      user_id: result.insertedId,
      auth_code,
      created_at: new Date(),
      type: 'verify', 
      is_verified: false
    });
    
    // Skip email verification in development (set user as active immediately)
    if (isDevelopment) {
      await users.updateOne({ _id: result.insertedId }, { $set: { is_active: true } });
      await authentication.updateOne(
        { user_id: result.insertedId, auth_code }, 
        { $set: { is_verified: true, verified_at: new Date() } }
      );
      console.log('⚠️  Skipping email verification (development mode)');
      res.status(201).json({ message: 'Registered successfully! Account activated automatically in development mode.' });
    } else {
      await sendVerificationEmail(email, auth_code);
      res.status(201).json({ message: 'Registered successfully, please verify your email!' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required()
});

router.post('/login', async (req, res) => {
  console.log('🔍 LOGIN REQUEST RECEIVED');
  console.log('📧 Email:', req.body.email);
  console.log('🔑 Password received:', req.body.password ? 'YES' : 'NO');
  console.log('🔑 Password length:', req.body.password ? req.body.password.length : 0);
  
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    console.log('❌ Validation error:', error.details[0].message);
    return res.status(400).json({ message: error.details[0].message });
  }
  
  const { email, password } = value;
  try {
    const db = await getDb();
    const users = db.collection('users');
    const redis = getRedis(req);
    
    // Clear cache first to ensure fresh data
    const cacheKey = `user:${email}`;
    await redis.del(cacheKey);
    console.log('🗑️ Cleared cache for:', email);
    
    const user = await users.findOne({ email });
    console.log('👤 User found in DB:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('✅ User active:', user.is_active);
      console.log('🔑 Password hash exists:', user.password ? 'YES' : 'NO');
      console.log('👑 Is superuser:', user.is_superuser);
      console.log('🏢 Is staff:', user.is_staff);
      console.log('🔐 Stored hash prefix:', user.password ? user.password.substring(0, 7) : 'NONE');
      console.log('🔐 Input password:', password);
    }
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Test multiple password possibilities
    console.log('🧪 Testing password matches...');
    
    const match = await bcrypt.compare(password, user.password);
    console.log('🔐 Password match result:', match ? 'YES' : 'NO');
    
    // Additional test with common passwords if first fails
    if (!match) {
      console.log('🧪 Testing common passwords...');
      const testPasswords = ['123456', 'password', 'admin', email.split('@')[0]];
      for (const testPwd of testPasswords) {
        const testMatch = await bcrypt.compare(testPwd, user.password);
        console.log(`🔐 Testing "${testPwd}":`, testMatch ? 'MATCH!' : 'no match');
        if (testMatch) {
          console.log(`✅ Found working password: "${testPwd}"`);
          break;
        }
      }
    }
    
    if (!match) {
      console.log('❌ Password mismatch - all tests failed');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const payload = {
      user_id: user._id,
      email: user.email,
      roles: user.roles || [],
      extra_permissions: user.extra_permissions || [],
      is_superuser: !!user.is_superuser,
      is_staff: !!user.is_staff
    };
    
    console.log('✅ Login successful, creating token');
    console.log('🎫 Token payload:', payload);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;