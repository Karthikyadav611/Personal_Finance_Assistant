const mongoose = require("mongoose");

let cachedConnection = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI (or MONGO_URI) is not defined in the environment");
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${connection.connection.host}`);

  cachedConnection = connection;
  return connection;
};

module.exports = connectDB;
