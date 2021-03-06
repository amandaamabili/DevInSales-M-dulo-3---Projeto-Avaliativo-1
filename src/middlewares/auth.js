const { verify } = require("jsonwebtoken");
const Role = require("../models/Role");
const { OWNER } = require('../utils/constants/roles');
const logger = require('../config/logger');


const Tracing = require("@sentry/tracing");
const Sentry = require("@sentry/node");

async function auth(req) {
    const transaction = Sentry.startTransaction({
    op: "auth",
    name: "verifica se possui autorização",
  });
  const { authorization } = req.headers;
  try {
    logger.info(`Iniciando a requisição. Request: ${req.url} `);


    if (!authorization) {
      logger.error("não possui autorização. CodeError: " + 22001);

      throw Error("não possui autorização");
    }
    const user = verify(authorization, process.env.SECRET);
    logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(user));
    transaction.finish();
    return user;
  } catch (error) {
    Sentry.captureException(error);
    transaction.finish();
    logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${22002}`);
    return { message: "Você não tem autorização para este recurso." };
  } 
}

function onlyCanAccessWith(permissionsCanAccess) {
  return async (req, res, next) => {
    const user = await auth(req, res);
    if (user.message) {
      /*
              #swagger.responses[403] = {
                schema: {
                  message: 'Você não tem autorização para este recurso.'
                }
              }
            */
      return res.status(403).send({ message: user.message });
    }
    const roles = await Role.findAll({
      where: {
        id: user.roles.map((role) => role.id),
      },
      include: [
        {
          association: "permissions",
          required: false,
          attributes: ["description"],
          through: {
            attributes: [],
          },
        },
      ],
    });
    let existPermission = false;
    roles.forEach((role) => {
      role.permissions.forEach((permission) => {
        if (!existPermission) {
          existPermission = permissionsCanAccess.includes(
            permission.description
          );
        }
      });
    });
    if (!existPermission) {
      /*
              #swagger.responses[403] = {
                schema: {
                  message: 'Você não tem autorização para este recurso.'
                }
              }
            */
      return res
        .status(403)
        .send({ message: "Você não tem autorização para este recurso." });
    }
    next();
  };
}
/**
 * 
 * Esta função é um middleware que verifica se o usuario logado tem o cargo de OWNER
 * Somente este cargo podem acessar as rotas com este middleware
 * @param {Request Express} req 
 * @param {Response Express} res 
 * @param {Next Express} next 
 * @returns 
 */
async function isOwner(req, res, next) {
  const user = await auth(req, res);
  if (user.message) {
    return res.status(403).send({ message: user.message });
  }
  const roles = await Role.findAll({
    attributes: ['description'],
    where: {
      id: user.roles.map((role) => role.id),
    }
  });
  const isOwner = roles.some(({ description }) => description === OWNER)
  if (!isOwner) {
    return res
      .status(403)
      .send({ message: "Apenas usuarios com cargo de OWNER podem acessar este recurso." });
  }
  next();
}
module.exports = {
  onlyCanAccessWith,
  isOwner
};
