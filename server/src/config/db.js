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
    console.warn(`[MongoDB] Standard connection to ${env.MONGO_URI} failed: ${err.message}`);
    console.log('[MongoDB] Launching embedded MongoDB instance for full standalone execution...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create({
        binary: {
          version: '4.4.29',
        },
      });
      const memUri = mongoMemoryServer.getUri();
      const memConn = await mongoose.connect(memUri);
      console.log(`[MongoDB] Connected to embedded MongoDB: ${memUri}`);
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
