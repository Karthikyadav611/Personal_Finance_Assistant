const mongoose = require("mongoose");

let cachedConnection = null;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in the environment");
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);

  cachedConnection = connection;
  return connection;
};

module.exports = connectDB;
