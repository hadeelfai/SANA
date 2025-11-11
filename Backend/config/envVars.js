import dotenv from 'dotenv';

dotenv.config();

export const envVars = {
    PORT: process.env.PORT || 10000,
    MONGO_URI: process.env.MONGO_URI,
    NODE_ENV: process.env.NODE_ENV || "development",
    JWT_SECRET: process.env.JWT_SECRET,
};