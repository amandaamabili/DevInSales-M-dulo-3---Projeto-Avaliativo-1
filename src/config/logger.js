const winston = require('winston');
 
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.json(),
        // winston.ExceptionHandler(new winston.transports.File({ filename: 'logs/registryLogs.log', level: 'fatal' }))
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/registryLogs.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/registryLogs.log', level: 'info' }),
    ],
    exitOnError: false
});

logger.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}


 
module.exports = logger;