const { MongoMemoryServer } = require('mongodb-memory-server');

async function test() {
  console.log('Starting MongoMemoryServer test...');
  try {
    const mongod = await MongoMemoryServer.create({
      binary: {
        version: '4.4.29',
      }
    });
    console.log('MongoMemoryServer URI:', mongod.getUri());
    await mongod.stop();
    console.log('Stopped successfully.');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
