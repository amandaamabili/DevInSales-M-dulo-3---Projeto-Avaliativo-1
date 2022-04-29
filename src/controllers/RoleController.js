const Role = require("../models/Role");
const Permission = require("../models/Permission");
const { validateErrors } = require("../utils/functions");
const logger = require('../config/logger');


module.exports = {
  async index(req, res) {
    /*
        #swagger.tags = ['Cargos e Permissões']
        #swagger.description = 'Endpoint para criar um novo Cargo. Nesse endpoint o usuário deve ter cargo de OWNER.'
    */
    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const roles = await Role.findAll({
        attributes: ["id", "description"],
        include: [
          {
            association: "users",
            attributes: ["id", "name", "email", "birth_date"],
            through: {
              attributes: [],
            },
          },
          {
            association: "permissions",
            attributes: ["id", "description"],
            through: {
              attributes: [],
            },
          },
        ],
      });

      logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(roles));
      return res.status(200).send({ roles });
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${24001}`);
      return res.status(400).send(message);
    }
  },
  async create(req, res) {
    /*
      #swagger.tags = ['Cargos e Permissões']
      #swagger.description = 'Endpoint para criar um novo Cargo. Nesse endpoint o usuário deve ter cargo de OWNER.'
      #swagger.parameters['obj'] = { 
          in: 'body', 
          "required":"true",
          'description':'A lista de permissões pode ser omitido na criação de um novo cargo.',
          '@schema': {
              "properties": { 
                  "description": { 
                      "type": "string",
                      "example": "financeiro" 
                  },
                  "permissions": {
                      $ref: '#/definitions/Permissions'
                  },
              } 
          } 
      } */
    try {

      const { description, permissions } = req.body;

      logger.info('Iniciando a requisição. Request: '+ req.url + '  Body: ' + JSON.stringify(req.body));

      if (!isNaN(parseInt(description))) {
        logger.warn(`Esta requisição não foi bem sucessida. CodeError: ${24002}`);
        throw new Error("A descrição não pode ser somente numeros.")
      }
      const role = await Role.create({ description });

      if (permissions && permissions.length > 0) {
        const permissionsEntity = await Permission.findAll({
          where: {
            id: permissions.map(({ permission_id }) => permission_id),
          },
        });

        if (permissionsEntity.length > 0) {
          await role.addPermissions(permissionsEntity);
        }
      }
         /* #swagger.responses[200] = { 
            schema: { $ref: "#/definitions/ResRole" }
        } */
        logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(role));
      return res.status(200).send({ message: "Cargo criado com sucesso." });
    } catch (error) {

      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${24003}`);
      return res.status(400).send(message);
    }
  },
  async addPermission(req, res) {
    /*
        #swagger.tags = ['Cargos e Permissões']
        #swagger.description = 'Endpoint para adicionar permissões um novo Cargo. Nesse endpoint o usuário deve ter cargo de OWNER.'
        #swagger.parameters['obj'] = { 
            in: 'body', 
            "required":"true",
            'description':'A lista de permissões é obrigatória e deve conter ids de permissões cadastradas previamente no sistema.<br>Caso seja enviado um uma permissão que o cargo já tenha, ela será desconsiderada, evitando duplicidade.',
            schema: {
                "permissions": {
                    $ref: '#/definitions/Permissions'
                },
            }
        } 
     */
    try {
      const { role_id } = req.params;
      const { permissions } = req.body;
      logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(response));
      if (!permissions || permissions.lengh === 0){

        logger.warn(`Esta requisição não foi bem sucessida. CodeError: ${24004}`);
        throw new Error("Permission não enviadas");

      }

      const role = await Role.findByPk(role_id, {
        attributes: ["id", "description"],
        include: {
          association: "permissions",
          attributes: ["id", "description"],
          through: { attributes: [] },
        },
      });

      if (!role){
        logger.warn(`Este cargo não existe. CodeError: ${24005}`);

        throw new Error("Este cargo não existe.");
      }

      const permissionsData = await Permission.findAll({
        attributes: ["id", "description"],
        where: {
          id: permissions.map((permission) => permission.permission_id),
        },
      });

      if (permissionsData.length === 0){
        logger.error("Permission enviadas não cadastradas. CodeError: " + 24006);

        throw new Error("Permission enviadas não cadastradas.");
      }
        

      await role.addPermissions(permissionsData);

      /* #swagger.responses[200] = { 
                  schema: {"message": "Permissões vinculadas com sucesso."}
              } */
              logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(permissionsData));
      return res
        .status(200)
        .send({ message: "Permissões vinculadas com sucesso." });
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${24007}`);
      return res.status(400).send(message);
    }
  }
};
