const Sale = require("../models/Sale");
const Product = require('../models/Product')
const ProductsSales = require('../models/ProductsSales')
const { Op } = require("sequelize");
const { validateErrors } = require("../utils/functions");
const Tracing = require("@sentry/tracing");
const Sentry = require("@sentry/node");
const logger = require('../config/logger');



module.exports = {

  async updateOnePrice(req, res) {

    const transaction = Sentry.startTransaction({
      op: "Produtos_Vendas",
      name: "Endpoint que atualiza a quantidade de produtos de uma venda.",
    });
    // #swagger.tags = ['Produtos_Vendas']
    // #swagger.description = 'Endpoint que atualiza a quantidade de produtos de uma venda.'
    /*#swagger.parameters['sale_id'] = {
      in: 'path',
      description: 'Id da venda' ,
      required: true,
      type: 'integer',
      example: 1
    }*/
    /*#swagger.parameters['product_id'] = {
  in: 'path',
  description: 'Id do produto' ,
  required: true,
  type: 'integer',
  example: 2
}*/
    /*#swagger.parameters['price'] = {
  in: 'path',
  description: 'Preço atualizado do produto' ,
  required: true,
  type: 'number',
  example: 999.99
}*/
    /* #swagger.responses[204] = {
        description: 'Sucesso na atualização do endpoint'
} */
    /* #swagger.responses[400] = {
        description: 'Id do produto enviado não é compatível ao cadastrado na venda, ou preço do produto é igual à zero'
} */
    /* #swagger.responses[401] = {
        description: 'Sem permissão para acessar o endpoint'
} */
    /* #swagger.responses[403] = {
        description: 'Sem permissão para acessar o endpoint'
} */
    /* #swagger.responses[404] = {
        description: 'Id de produto ou venda não existem'
} */

    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const { sale_id, product_id, price } = req.params;
      const saleResult = await Sale.findByPk(sale_id)
      const productResult = await Product.findByPk(product_id)
      const productSaleResult = await ProductsSales.findAll({
        attributes: ['id', 'unit_price', 'amount', 'sales_id', 'product_id'],
        where: {
          sales_id: {
            [Op.eq]: sale_id
          }
        }
      })
      if (!saleResult || !productResult) {
        logger.error("id de Produto ou de Venda não existem. CodeError: " + 25001);
        return res.status(404).send({ message: "id de Produto ou de Venda não existem" });

      } else {

        if (productSaleResult[0].dataValues.product_id !== Number(product_id)) {
          logger.error("Id do produto enviado não é compatível ao cadastrado na venda. CodeError: " + 25002);
          return res.status(400).send({ message: "Id do produto enviado não é compatível ao cadastrado na venda." });

        } else {
          if (price <= 0 || isNaN(price)) {
            logger.error("Preço deve ser um número superior à zero. CodeError: " + 25003);

            return res.status(400).send({ message: "Preço deve ser um número superior à zero" });
          }
          const id = Number(productSaleResult[0].dataValues.id)

          const result = await ProductsSales.update(
            { unit_price: Number(price) },
            { where: { id: id } }
          )

          transaction.finish();
          logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(result));
          return res.status(204).send();

        }
      }


    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${25004}`);
      return res.status(400).send(message);
    }
  },
  async updateOne(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Produtos_Vendas",
      name: "Endpoint que atualiza a quantidade de produtos de uma venda.",
    });
    // #swagger.tags = ['Produtos_Vendas']
    // #swagger.description = 'Endpoint que atualiza a quantidade de produtos de uma venda.'
    /*#swagger.parameters['sale_id'] = {
  in: 'path',
  description: 'Id da venda' ,
  required: true,
  type: 'integer',
  example: 1
}*/
    /*#swagger.parameters['product_id'] = {
  in: 'path',
  description: 'Id do produto' ,
  required: true,
  type: 'integer',
  example: 2
}*/
    /*#swagger.parameters['amount'] = {
  in: 'path',
  description: 'Quantidade atualizada do produto' ,
  required: true,
  type: 'integer',
  example: 20
}*/
    /* #swagger.responses[204] = {
        description: 'Sucesso na atualização do endpoint'
} */
    /* #swagger.responses[400] = {
        description: 'Id do produto enviado não é compatível ao cadastrado na venda, ou quantidade atualizada é igual à zero'
} */
    /* #swagger.responses[401] = {
        description: 'Sem permissão para acessar o endpoint'
} */
    /* #swagger.responses[403] = {
        description: 'Sem permissão para acessar o endpoint'
} */
    /* #swagger.responses[404] = {
        description: 'Id de produto ou venda não existem'
} */
    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const { sale_id, product_id, amount } = req.params;
      const saleResult = await Sale.findByPk(sale_id)
      const productResult = await Product.findByPk(product_id)
      const productSaleResult = await ProductsSales.findAll({
        attributes: ['id', 'unit_price', 'amount', 'sales_id', 'product_id'],
        where: {
          sales_id: {
            [Op.eq]: sale_id
          }
        }
      })
      if (!saleResult || !productResult) { //confere se id de Venda e de Produto existem no banco
        logger.error("id de Produto ou de Venda não existem. CodeError: " + 25005);

        return res.status(404).send({ message: "id de Produto ou de Venda não existem" });

      } else {

        if (productSaleResult[0].dataValues.product_id !== Number(product_id)) { //confere se Produto repassado no Params é o mesmo cadastrado na Venda 
          logger.error("Id do produto enviado não é compatível ao cadastrado na venda. CodeError: " + 25006);
          return res.status(400).send({message:"Id do produto enviado não é compatível ao cadastrado na venda."});
        }else {
          if(amount<=0||isNaN(amount)){ //confere se Produto repassado no Params é o mesmo cadastrado na Venda 
            logger.error("Quantidade deve ser um número superior à zero. CodeError: " + 25007);
            return res.status(400).send({message:"Quantidade deve ser um número superior à zero"});
          return res.status(400).send({ message: "Id do produto enviado não é compatível ao cadastrado na venda." });
        } else {
          if (amount <= 0 || isNaN(amount)) { //confere se Produto repassado no Params é o mesmo cadastrado na Venda 
            logger.error("Quantidade deve ser um número superior à zero. CodeError: " + 25007);

            return res.status(400).send({ message: "Quantidade deve ser um número superior à zero" });
          }
          const id = Number(productSaleResult[0].dataValues.id)

          const result = await ProductsSales.update(
            { amount: Number(amount) },
            { where: { id: id } }
          )

          transaction.finish();
          logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(result));
          return res.status(204).send();
        }
      }
    }
    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      const message = validateErrors(error);
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(message)} . CodeError: ${25008}`);
      return res.status(400).send(message);
    }
  },
};