const mongoose = require("mongoose");
const logger = require("../utilities/logger.util");

const connectDB = async () => {
  const options = process.env.DB_NAME ? { dbName: process.env.DB_NAME } : {};
  await mongoose.connect(process.env.DB_URI, options);
  logger.info(
    `MongoDB connected successfully | database:${mongoose.connection.name}`,
  );
};

module.exports = {connectDB};
