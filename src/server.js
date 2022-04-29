require("dotenv").config();

const morganMiddleware = require("./middlewares/morgan.middleware");
const Sentry = require("@sentry/node");

const express = require('express')

const logger = require('./config/logger.js');
const routes = require('./routes')
require('./database')

const app = express()
const PORT = process.env.PORT || 3333

const swaggerUI = require('swagger-ui-express')
const swaggerFile = require('./swagger.json')

Sentry.init({
    dsn: process.env.SENTRY_URL || "",
  
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    environment: process.env.NODE_ENV || "development",
    enabled: process.env.SENTRY_ENABLED || false,    
    tracesSampleRate: 1.0,
  });

app.use(morganMiddleware);
app.use(express.json())
app.use(routes)
app.use('/api/v1/docs', swaggerUI.serve, swaggerUI.setup(swaggerFile))

app.listen(PORT, () => {
    logger.info(`Servidor está rodando na porta ${PORT}`);
    console.log(`Executando na porta ${PORT}`)
}) 
