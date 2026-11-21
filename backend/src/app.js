'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { getConfig } = require('./config/env');

function createApp() {
  const config = getConfig();
  const app = express();

  if (config.trustProxy) app.set('trust proxy', 1); // Running behind nginx
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10kb' }));

  app.use('/api', routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
