import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '../docs/swaggerDoc.js';

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
