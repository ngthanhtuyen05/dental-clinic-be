import { Sequelize } from 'sequelize';
import env from './env.js';

const sequelize = new Sequelize(
  env.DB_NAME,
  env.DB_USER,
  env.DB_PASSWORD,
  {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'mysql',
    logging: env.isDevelopment ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('[Database] MySQL connection has been established successfully.');
  } catch (error: any) {
    console.error('[Database] Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

export default sequelize;
