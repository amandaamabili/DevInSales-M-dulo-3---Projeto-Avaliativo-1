const { validateErrors } = require("../utils/functions");
const UserServices = require("../services/user.service");
const logger = require('../config/logger');



module.exports = {
  async create(req, res) {
    /*
          #swagger.tags = ['Usuário']
          #swagger.description = 'Endpoint que criar um novo usuário.'
          #swagger.parameters['obj'] = {
            in: 'body',
            required: true,
            schema: {
              $ref: '#/definitions/AddUser'
            }
          }
          #swagger.responses[201] = {
            description: 'Created',
            schema: {
              message: 'Usuário salvo com sucesso.'
            }
          }
          #swagger.responses[403] = {
            description: 'Forbidden'
          }
        */
    try {
      const { name, password, email, birth_date, roles } = req.body;
      logger.info('Iniciando a requisição. Request: '+ req.url + '  Body: ' + JSON.stringify(req.body));

      const user = await UserServices.createUser(
        name,
        password,
        email,
        birth_date,
        roles
      );
      /*
        #swagger.responses[201] = {
          schema: {
            response: 42
          }
        }
      */
        logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(user));
        return res.status(201).send({ response: user });

    } catch (error) {
      const message = validateErrors(error);
      /*
              #swagger.responses[400] = {
                schema: {
                  $ref: '#/definitions/CreateUserResponses'
                }
              }
            */
             
       logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${22011}`);
      return res.status(400).send(message);
    }
  },
  async session(req, res) {
    /*
         #swagger.tags = ['Usuário']
         #swagger.description = 'Endpoint para login do usuário, quando email e senha são validos retorna um token.'
         #swagger.parameters['obj'] = {
           in: 'body',
           required: true,
           schema: {
             $ref: '#/definitions/UserLogin'
           }
         }
         #swagger.responses[201] = {
           description: 'Token de acesso',
           schema: {
             "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInJvbGVzIjpbeyJpZCI6Miwi___RANDOM_TOKEN___JPV05FUiJ9XSwiaWF0IjoxNjQ2ODA0MDkxLCJleHAiOjE2NDY4OTA0OTF9.OwvUy0p3BVfbicuCg9YYAk5tlPQ6UKB_bZrHt8-H_CU"
           }
         }
         #swagger.responses[400] = {
           description: 'Login não efetuado',
           schema: {
             "message": "Email ou senha inválidos"
           }
         }
       */
    try {
      const { email, password } = req.body;
      logger.info('Iniciando a requisição. Request: '+ req.url + '  Body: ' + JSON.stringify(req.body));

      const token = await UserServices.beginSession(email, password);

      if (token.error) {
        logger.error("Houve um erro na geração do token. CodeError: " + 22012);
        throw new Error(token.error);
      }
      logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(token));
      return res.status(201).send({ token: token });
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${22013}`);
      return res.status(400).send(message);
    }
  },
  async index(req, res) {
    /*
          #swagger.tags = ['Usuário']
          #swagger.description = 'Endpoint para buscar todos os usuários do banco de dados.'
          #swagger.parameters['name'] = {
            in: 'query',
            type: 'string',
            description: 'Nome de um usuário.',
            default: 'John Doe'
          }
          #swagger.parameters['birth_date_min'] = {
            in: 'query',
            type: 'string',
            description: 'Data limite inferior da consulta.',
            default: 'DD/MM/AAAA'
          }
          #swagger.parameters['birth_date_max'] = {
            in: 'query',
            type: 'string',
            description: 'Data limite superior da consulta.',
            default: 'DD/MM/AAAA'
          }
        */
    try {
      const { name, birth_date_min, birth_date_max } = req.query;

      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const users = await UserServices.getUsers(
        name,
        birth_date_min,
        birth_date_max
      );
      if (users.error) {
        logger.error("Houve um erro ao listar o usuário. CodeError: " + 22014);
        throw new Error(users.error);
      }

      if (users.length === 0) {
        logger.warn(`Esta requisição não foi bem sucessida. CodeError: ${22015}`);
        return res.status(204).send();
      }
      /*
        #swagger.responses[200] = {
        schema: {
          $ref: '#/definitions/UserInfo'
        }
      }
      */
      logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(users));
      return res.status(200).send({ users });
    } catch (error) {
      const message = validateErrors(error);
      /*
       #swagger.responses[400] = {
       schema: {
         message: 'Informe uma data em um formato válido dd/mm/yyyy'
       }
     }
     */
     logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${22016}`);
      return res.status(400).send(message);
    }
  },
  async delete(req, res) {
    // #swagger.tags = ['Usuário']
    // #swagger.description = 'Endpoint para deletar um usuário.'
    /*
      #swagger.parameters['user_id'] = {
        in: 'path',
        type: 'integer',
        required: true
      }
      #swagger.responses[200] = {
        schema: {
          message: 'Usuario deletado com sucesso'
        }
      }
      #swagger.responses[400] = {
        schema: {
          error: 'Formato de id invalido!'
        }
      }
      #swagger.responses[403] = {
        schema: {
          message: 'Você não tem autorização para este recurso.'
        }
      }
      #swagger.responses[404] = {
        schema: {
          message: 'Não se encontrou nenhum usuario como o id informado '
        }
      }
    */
    try {
      const { user_id } = req.params;
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const message = await UserServices.deleteUser(user_id);

      if (message.error) {
        logger.error("Desculpe, houve um erro ao deletar. CodeError: " + 22018);

        throw new Error(message.error);
      }
      logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(message));
      return res.status(200).json({ message });
    } catch (error) {
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${22019}`);
      return res.status(400).json({ error: error.message });
    }
  },
  // async test(req, res) {
   
  //   try {
  //     const { description } = req.body;
  

  //     return res.status(201).send({ description: description });
  //   } catch (error) {
  //     const message = validateErrors(error);
  //     return res.status(400).send(message);
  //   }
  // },
};
