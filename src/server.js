require("dotenv").config();

const morgan = require('morgan');
const express = require('express')

const logger = require('./config/logger');
const routes = require('./routes')
require('./database')

const app = express()
const PORT = process.env.PORT || 3333

const swaggerUI = require('swagger-ui-express')
const swaggerFile = require('./swagger.json')

app.use(require("morgan")("combined", { "stream": logger.stream }));
app.use(express.json())
app.use(routes)
app.use('/api/v1/docs', swaggerUI.serve, swaggerUI.setup(swaggerFile))

app.listen(PORT, () => console.log(`Executando na porta ${PORT}`)) 
