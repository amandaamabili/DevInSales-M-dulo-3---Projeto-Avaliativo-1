const Permission = require('../models/Permission');
const { validateErrors } = require('../utils/functions')
const Tracing = require("@sentry/tracing");
const Sentry = require("@sentry/node");
const logger = require('../config/logger');


module.exports = {

    async create(req, res) {
        const transaction = Sentry.startTransaction({
            op: "permission",
            name: "Endpoint para criar uma nova Permissão.",
        });
        /*
       #swagger.tags = ['Cargos e Permissões']
       #swagger.description = 'Endpoint para criar uma nova Permissão.'
       #swagger.parameters['obj'] = { 
           in: 'body', 
           "required":"true",
           'description':'Para criar uma nova permissão envie os dados como no exemplo.',
           '@schema': {
               "properties": { 
                   "description": { 
                       "type": "string",
                       "example": "READ" 
                   }
               } 
           } 
       } */
        try {
            logger.info(`Iniciando a requisição. Request: ${req.url} `);

            const { description } = req.body
            await Permission.create({ description })
            /*
                #swagger.responses[200] = {
                schema: {
                message: 'Permissão criado com sucesso.'
                }
            }
            */
            transaction.finish();
            logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(message));
            return res.status(200).send({ message: 'Permissão criado com sucesso.' })
        } catch (error) {
            Sentry.captureException(error);
            transaction.finish();
            const message = validateErrors(error)
            logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${27010}`);
            return res.status(400).send(message)
        }
    }
}