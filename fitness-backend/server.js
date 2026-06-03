import { connectDB } from './src/config/db.js';
import app from './src/app.js';
import { env } from './src/config/env.js';
import logger from './src/utils/logger.util.js';

connectDB()
  .then(() => {
    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    process.exit(1);
  });
