const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multiplayer_Ai';
  try {
    mongoose.set('strictQuery', false);
    
    // Explicitly target database 'multiplayer_Ai' to prevent MongoDB Atlas from defaulting to 'test'
    await mongoose.connect(uri, {
      dbName: 'multiplayer_Ai',
      serverSelectionTimeoutMS: 5000,
    });
    
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to database: multiplayer_Ai`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB (${error.message}). Falling back to in-memory store for active session.`);
    isConnected = false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };
