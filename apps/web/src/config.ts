import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Application configuration
export const config = {
  port: process.env.PORT || 2512, // Default port if not specified in environment
}; 