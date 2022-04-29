const Product = require("../models/Product");
const { validateErrors } = require("../utils/functions");
const { Op } = require("sequelize");
const logger = require('../config/logger');

const {
  indexProductService,
  storeProductService,
  updateProductService,
  getProductById,
  countSalesByProductId,
} = require("../services/product.service");

module.exports = {
  async index(req, res) {

    /* #swagger.tags = ['Produto']
    #swagger.description = 'Endpoint para buscar produtos conforme critério query params. Caso a busca seja feita sem os parâmetros, o endpoint irá retornar todos os produtos cadastrados. Nesse endpoint o usuário deve ter permissão READ.'
    #swagger.parameters['name'] = {
      in: 'query',
      description: 'query para buscar produtos pelo nome',
      required: false,
    },
    #swagger.parameters['price_min'] = {
    in: 'query',
    description: 'query para buscar produtos pelo preço mínimo',
    required: false,
    type: 'number',
  },
   #swagger.parameters['price_max'] = {
    in: 'query',
    description: 'query para buscar produtos pelo preço máximo',
    required: false,
    type: 'number',

  } */

    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const { name, price_min, price_max } = req.query;

      const products = await indexProductService(name, price_min, price_max);

      if (products.length === 0) {
        logger.error("Não existe produto. CodeError: " + 26002);

        return res.status(204).send();
      }
      logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(products));
      return res.status(200).send({ products });

      /* #swagger.responses[200] = { 
               schema: { $ref: "#/definitions/GetProduct" },
               description: "Produtos:" 
        } */

    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${26003}`);
      return res.status(400).send(message);
    }
  },
  async store(req, res) {

    /*#swagger.tags = ['Produto']
   #swagger.description = 'Endpoint para criar um novo produto. Nesse endpoint o usuário deve ter permissão WRITE.'
   #swagger.parameters['obj'] = {
       in: 'body',
       required: true,
       schema: {
         $ref: '#/definitions/AddProduct'
       }
     }*/


    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const newProduct = req.body;

      const product = await storeProductService(newProduct);
      /* #swagger.responses[200] = { 
              schema: { $ref: "#/definitions/ResProduct" },
              description: "Produto criado com sucesso!" 
       } */
       logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(product));
      return res.status(200).send({
        message: "Produto criado com sucesso!",
        novoProduto: {
          nome: product.name,
          preço_sugerido: product.suggested_price,
        },
      });
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${26004}`);
      return res.status(400).send(message);
    }
  },
  async putUpdate(req, res) {
    /*#swagger.tags = ['Produto']
    #swagger.description = 'Endpoint para atualizar todos as propriedades de um produto. Neste endpoint o usuário logado deve ter permissão de UPDATE.'
    #swagger.parameters['product_id'] = {
      in: 'path',
      description: 'parâmetro id para buscar um produto para atualização',
      required: true,
      type: 'number',
    }
    #swagger.parameters['obj'] = {
        in: 'body',
        required: true,
        schema: {
          $ref: '#/definitions/PutProduct'
        }
      }*/


    try {

      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const { product_id } = req.params;
      const { name, suggested_price } = req.body;

      if (!name) {
        logger.warn(`O campo name, não foi enviado. CodeError: ${26005}`);
        throw new Error("O campo name, não foi enviado.");
      }
      if (!suggested_price) {
        logger.warn(`O campo suggested_price, não foi enviado. CodeError: ${26006}`);
        throw new Error("O campo suggested_price, não foi enviado.");
      }
      if (Number(suggested_price) <= 0) {
        logger.warn(`O campo suggested_price, deve ser maior que 0. CodeError: ${26007}`);

        throw new Error("O campo suggested_price, deve ser maior que 0.");
      }

      const product = await updateProductService(
        product_id,
        name,
        suggested_price
      );

      if (!product) {
        logger.error("Produto não encontrado. CodeError: " + 26008);

        return res.status(404).send({ message: "Produto não encontrado." });
      }
      logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(product));
      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${26009}`);
      return res.status(400).send(message);
    }
  },
  async update(req, res) {
    /* #swagger.tags = ['Produto']
   #swagger.description = 'Endpoint para alterar apenas uma propriedade de um produto, name ou suggested_price. Neste endpoint o usuário logado deve ter permissão de UPDATE.'
   #swagger.parameters['id'] = {
     in: 'path',
     description: 'parâmetro id para buscar um produto para atualização',
     required: true,
     type: 'number',
   } 
   #swagger.parameters['obj'] = {
     in: 'body',
     required: true,
     schema: {
       $ref: '#/definitions/PatchProduct'
     }
   }*/

    try {

      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const { id } = req.params;
      const { name, suggested_price } = req.body;

      const updatedProduct = await updateProductService(
        id,
        name,
        suggested_price
      );

      if (!updatedProduct) {

        logger.error("`Não existe produto com o id. CodeError: " + 26010);

        return res
          .status(404)
          .send({ message: `Não existe produto com o id ${id}` });
      }
      logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(updatedProduct));
      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${26011}`);
      return res.status(400).send(message);
    }
  },
  async delete(req, res) {
    /*#swagger.tags = ['Produto']
   #swagger.description = 'Endpoint para deletar um produto, neste endpoint o usuário logado deve ter permissão de DELETE e não pode ser um produto vendido.'
     #swagger.parameters['id'] = {
     in: 'path',
     description: 'parâmetro id para buscar um produto para deleção',
     required: true,
     type: 'number',
   } */


    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const { id } = req.params;

      const countSales = await countSalesByProductId(id)
      if (countSales > 0) {
        logger.warn('Produto não pode ser deletado, produto já vendido.');
        throw new Error("Produto não pode ser deletado, produto já vendido.");
      }
      const product = await getProductById(Number(id));
      if (!product) {
        logger.error("Não existe venda para este ID. CodeError: " + 26012);
        return res.status(404).send({ message: "Produto não encontrado." });
      }
      await product.destroy();

      logger.info('Request: '+ req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(product));
      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${26013}`);
      return res.status(400).send(message);
    }
  },
};
