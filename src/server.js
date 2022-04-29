require("dotenv").config();

const morganMiddleware = require("./middlewares/morgan.middleware");

const express = require('express')

const logger = require('./config/logger.js');
const routes = require('./routes')
require('./database')

const app = express()
const PORT = process.env.PORT || 3333

const swaggerUI = require('swagger-ui-express')
const swaggerFile = require('./swagger.json')


app.use(morganMiddleware);
app.use(express.json())
app.use(routes)
app.use('/api/v1/docs', swaggerUI.serve, swaggerUI.setup(swaggerFile))

app.listen(PORT, () => {
    logger.info('Servidor está rodando na porta 9000');
    console.log(`Executando na porta ${PORT}`)
}) 
