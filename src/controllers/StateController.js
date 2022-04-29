const State = require("../models/State");
const City = require("../models/City");
const { validateErrors } = require("../utils/functions");
const { ACCENT, UNNACENT } = require("../utils/constants/accents");
const logger = require('../config/logger');

const { Op, where, fn, col } = require("sequelize");
const Tracing = require("@sentry/tracing");
const Sentry = require("@sentry/node");

module.exports = {
  async index(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Estado",
      name: "Endpoint que retorna os estados com base no nome fornecido via query, ou então todos os estados caso nenhuma query seja passada",
    });
    /*
      #swagger.tags = ['Estado']
      #swagger.description = 'Endpoint que retorna os estados com base no nome fornecido via query, ou então todos os estados caso nenhuma query seja passada'
      #swagger.parameters['name'] = {
        in: 'query',
        description: 'Filtro que identifica o nome integral ou parcial dos estados que serão retornados',
        type: 'array',
        collectionFormat: 'multi',
      }
      #swagger.parameters['initials'] = {
        in: 'query',
        description: 'Filtro que identifica as iniciais integral ou parcial dos estados que serão retornados',
        type: 'array',
        collectionFormat: 'multi',
      }
    */
    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const names = [req.query.name];
      const initials = [req.query.initials];

      if (names[0] !== undefined || initials[0] !== undefined) {
        const states = await Promise.all(
          initials
            .flat()
            .map(async (initial) => {
              return await State.findAll({
                where: { initials: { [Op.iLike]: `%${initial}%` } },
              });
            })
            .concat(
              names.flat().map(async (name) => {
                return await State.findAll({
                  where: where(
                    fn("translate", fn("lower", col("State.name")), ACCENT, UNNACENT),
                    {
                      [Op.iLike]: `%${name
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")}%`,
                    })
                });
              })
            )
        );

        const filteredStates = [
          ...new Map(
            states.flat().map((state) => [state["id"], state])
          ).values(),
        ];
        if (filteredStates.length === 0) {
          logger.error("Não foi encontrado um estado. CodeError: " + 23001);

          return res.status(204).send();
        } else {
          logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(filteredStates));
          return res.status(200).send(filteredStates);
        }
      }

      else {
        const states = await State.findAll();
        if (states.length === 0) {
          logger.error("Não existe esse dado no banco. CodeError: " + 23002);

          return res.status(204).send();
        }
        else {
          transaction.finish();
          logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(states));

          return res.status(200).send({ states });
        }
      }
    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${23003}`);
      return res.status(400).send(message);
    }
  },

  async getStateById(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Estado",
      name: "Endpoint que retorna um estado de acordo com o state_id fornecido",
    });
    /*
    #swagger.tags = ['Estado']
    #swagger.description = 'Endpoint que retorna um estado de acordo com o state_id fornecido'
    #swagger.parameters['state_id'] = {
      description: 'ID do estado que será buscado',
      type: 'number',
      required: 'true',
    }
  */

    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const { state_id } = req.params;

      if (isNaN(state_id)) {
        logger.error("The 'state_id' param must be an integer. CodeError: " + 23004);

        return res
          .status(400)
          .send({ message: "The 'state_id' param must be an integer" });
      }

      const state = await State.findAll({
        where: { id: { [Op.eq]: state_id } },
      });

      if (state.length === 0) {

        logger.error("Couldn't find any state with the given 'state_id'. CodeError: " + 23005);

        return res
          .status(404)
          .send({
            message: "Couldn't find any state with the given 'state_id'",
          });
      } else {
        transaction.finish();
        return res.status(200).send(state[0]);
      }
    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${23006}`);
      return res.status(400).send(message);
    }
  },

  async getCitiesByStateID(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Estado",
      name: "Endpoint para buscar cidade(s) por estado",
    });
    /* 
   #swagger.tags = ['Estado']
   #swagger.description = 'Endpoint para buscar cidade(s) por estado'
   */
    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const { state_id } = req.params;
      const { name } = req.query;

      const state = await State.findOne({
        where: {
          id: state_id,
        },
      });

      if (!state) {
        logger.error("Estado não encontrado. CodeError: " + 23007);

        return res.status(404).json({ message: "Estado não encontrado." });
      }

      const query = {
        state_id,
      };

      if (name) {
        query.name = where(
          fn("translate", fn("lower", col("City.name")), ACCENT, UNNACENT),
          {
            [Op.iLike]: `%${name
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")}%`,
          }
        );
      }

      const cities = await City.findAll({
        where: query,
        attributes: ["id", "name"],
        include: [
          {
            model: State,
            as: "state",
            attributes: ["id", "name", "initials"],
          },
        ],
      });

      if (!cities.length) {
        logger.warn('Não existe nenhuma cidade cadastrada');
        return res.status(204).json({});
      }
      transaction.finish();
      logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(cities));
      return res.status(200).json({ cities });
    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${23008}`);
      return res.status(400).send(message);
    }
  },
  async postStateIdCity(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Estado",
      name: "'O Endpoint verifica se o Estado já existe e se existe alguma outra cidade criada no Estado com o mesmo nome. Caso não exista, cria-se uma nova Cidade. Nesse endpoint o usuário deve ter permissão WRITE.",
    });
    // #swagger.tags = ['Estado']
    // #swagger.description = 'O Endpoint verifica se o Estado já existe e se existe alguma outra cidade criada no Estado com o mesmo nome. Caso não exista, cria-se uma nova Cidade. Nesse endpoint o usuário deve ter permissão WRITE.'
    /*#swagger.parameters['state_id'] = {
      in: 'path',
      description: 'Id do Estado' ,
      type: 'number'
    }
    #swagger.parameters['obj'] = {
      in: 'body',
      required: true,
      schema: {
        $ref: '#/definitions/AddCity'
      }
    }
     #swagger.responses[201] = { 
               schema: { $ref: "#/definitions/ResState" },
        } 
      
     #swagger.responses[403] = {
        description: 'O usuário não tem permissão(Forbidden)'
      } 
     #swagger.responses[404] = {
        description: 'O Estado não existe no Banco de Dados(No found)'
      } 
     #swagger.responses[400] = {
        description: 'Já existe uma cidade com este nome para o Estado(Bad Request)'
      } 
     */

    try {

      const { state_id } = req.params;
      const { name } = req.body;
      logger.info('Iniciando a requisição. Request: ' + req.url + '  Body: ' + JSON.stringify(req.body));

      const state = await State.findByPk(state_id);

      if (!state) {
        logger.warn(`O Estado não existe no Banco de Dados. CodeError: ${23009}`);
        return res
          .status(404)
          .send({ message: "O Estado não existe no Banco de Dados" });
      }

      const city = await City.findOne({
        where: {
          name: where(
            fn("translate", fn("lower", col("City.name")), ACCENT, UNNACENT),
            {
              [Op.iLike]: `%${name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")}%`,
            }
          ),
          state_id: state.id,
        },
      });

      if (city) {
        logger.error("Já existe uma cidade com nome de ${name} no Estado de ${state.name}. CodeError: " + 23010);

        return res
          .status(400)
          .send({
            message: `Já existe uma cidade com nome de ${name} no Estado de ${state.name}`,
          });
      }

      const newCity = await City.create({
        name,
        state_id,
      });
      transaction.finish();

      logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(newCity.id));
      return res.status(201).send({ city: newCity.id });
    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${23011}`);
      return res.status(403).send(message);
    }
  }
};


