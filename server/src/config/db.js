const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const env = require('./env');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    // Attempt standard connection to specified MONGO_URI
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] External connection to ${env.MONGO_URI} unavailable: ${err.message}`);
    console.log('[MongoDB] Launching embedded MongoDB instance with local persistent storage...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const isTest = process.env.NODE_ENV === 'test';

      const options = {
        binary: {
          version: '4.4.29',
        },
      };

      if (!isTest) {
        const dbDir = path.join(__dirname, '../../../data/db');
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
        options.instance = {
          dbPath: dbDir,
          storageEngine: 'wiredTiger',
        };
      }

      mongoMemoryServer = await MongoMemoryServer.create(options);
      const memUri = mongoMemoryServer.getUri();
      const memConn = await mongoose.connect(memUri);
      console.log(`[MongoDB] Connected to embedded MongoDB: ${memUri}`);
      if (!isTest) {
        console.log(`[MongoDB] Data persisted in local storage: data/db`);
      }
      return memConn;
    } catch (memErr) {
      console.error('[MongoDB] Failed to launch embedded MongoDB instance:', memErr.message);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
