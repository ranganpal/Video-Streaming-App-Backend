import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger configuration options.
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Video Streaming App Backend API',
      version: '1.0.0',
      description: 'API documentation for the Video Streaming App Backend',
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Local server',
      },
      {
        url: 'https://video-streaming-app-backend-q1zx.onrender.com/api/v1',
        description: 'Production server',
      },
    ],
  },
  apis: ['./src/**/*.js'], // Path to your JSDoc-annotated files
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };