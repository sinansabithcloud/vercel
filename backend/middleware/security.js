const helmet = require('helmet');
const morgan = require('morgan');

const setupMiddleware = (app) => {
  // Security middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Logging middleware
  app.use(morgan('combined'));

  // Request size limiting
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
};

module.exports = setupMiddleware;
