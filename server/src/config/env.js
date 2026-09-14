require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/company_saas',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_spheresaas_production_grade_998877',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@sphereops.io',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
};
