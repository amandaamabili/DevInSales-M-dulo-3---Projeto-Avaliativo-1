require("dotenv").config();

const morganMiddleware = require("./middlewares/morgan.middleware");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

const express = require('express')

const logger = require('./config/logger.js');
const routes = require('./routes')
require('./database')

const app = express()
const PORT = process.env.PORT || 3333

const swaggerUI = require('swagger-ui-express')
const swaggerFile = require('./swagger.json')

Sentry.init({
    dsn: "https://b9857876e7754a26a982cadf90ed914a@o1224294.ingest.sentry.io/6369069",
  
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });

app.use(morganMiddleware);
app.use(express.json())
app.use(routes)
app.use('/api/v1/docs', swaggerUI.serve, swaggerUI.setup(swaggerFile))

app.listen(PORT, () => {
    logger.info('Servidor está rodando na porta 9000');
    console.log(`Executando na porta ${PORT}`)
}) 
