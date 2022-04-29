const { literal } = require('sequelize');
const logger = require('../config/logger');

const { decode } = require("jsonwebtoken");
const { validateErrors, daysToDelivery } = require('../utils/functions');

const salesRoutes = require('../routes/v1/sales.routes');

const Sale = require('../models/Sale')
const User = require("../models/User");
const ProductsSales = require("../models/ProductsSales");
const Product = require("../models/Product");
const Address = require('../models/Address');
const Delivery = require('../models/Deliveries');
const State = require('../models/State');
const Tracing = require("@sentry/tracing");
const Sentry = require("@sentry/node");



module.exports = {
  async createBuy(req, res) {

    const transaction = Sentry.startTransaction({
      op: "Vendas",
      name: "Endpoint para criar uma venda.",
    });
    // #swagger.tags = ['Vendas']
    // #swagger.description = 'Endpoint para criar uma venda.'
    /* #swagger.parameters['obj'] = {
            in:'body',
            schema:{
            'seller_id':1,
            'dt_sale':'1980/05/19'
            }
        }
        #swagger.parameters[user_id] = {
            in:'path'
        }
    */
    const { user_id } = req.params
    const { seller_id, dt_sale } = req.body

    try {

      logger.info('Iniciando a requisição. Request: ' + req.url + '  Body: ' + JSON.stringify(req.body));

      if (!Number(seller_id)) {
        logger.error("Seller_id deve ser um número. CodeError: " + 28001);
        throw new Error('Seller_id deve ser um número');
      }

      if (!user_id) {
        logger.error("Precisa enviar o user_id. CodeError: " + 28005);
        throw new Error('Precisa enviar o user_id');
      }

      if (dt_sale.length < 10) {
        logger.error("Formato de data inválido. CodeError: " + 28006);
        throw new Error('Formato de data inválido');
      }

      if (new Date(dt_sale) == 'Invalid Date') {
        logger.error("Formato de data inválido. CodeError: " + 28007);
        throw new Error('Formato de data inválido')
      }

      const result = await Sale.create({
        seller_id: (seller_id) ? seller_id : null,
        buyer_id: user_id,
        dt_sale: dt_sale
      })
      transaction.finish();
      logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(result));

      return res.status(201).send({ 'created': "id-" + result.id })

    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      if (error.message.includes('sales_seller_id_fkey')) {
        logger.error("Seller_id inexistente. CodeError: " + 28008);

        return res.status(404).send({ message: "seller_id inexistente" })
      }

      if (error.message.includes('sales_buyer_id_fkey')) {

        logger.error("Buyer_id inexistente. CodeError: " + 28009);
        return res.status(404).send({ message: "buyer_id inexistente" })
      }

      if (error.message.includes('invalid input syntax')) {

        logger.error("User_id em formato inválido. CodeError: " + 28010);
        return res.status(400).send({ message: "User_id em formato inválido" });
      }
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${28011}`);
      res.status(400).send({ message: error.message });
    }

  },
  async createSale(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Vendas",
      name: "Endpoint para criar uma venda",
    });
    // #swagger.tags = ['Vendas']
    // #swagger.description = 'Endpoint para criar uma venda.'
    /* #swagger.parameters['obj'] = {
            in:'body',
            schema:{
            'buyer_id':1,
            'dt_sale':'1980/05/19'
            }
        }
        #swagger.parameters[user_id] = {
            in:'path'
        }
    */
    const { user_id } = req.params;
    const { buyer_id, dt_sale } = req.body;

    logger.info('Iniciando a requisição. Request: ' + req.url + '  Body: ' + JSON.stringify(req.body))

    try {
      if (dt_sale.length < 10) {
        logger.error("Formato de data inválido. CodeError: " + 28012);

        throw new Error('Formato de data inválido')
      }
      if (!buyer_id) {
        logger.error("Precisa existir um comprador. CodeError: " + 28013);

        throw new Error("Precisa existir um comprador")
      }
      if (new Date(dt_sale) == 'Invalid Date') {
        logger.error("Formato de data inválido. CodeError: " + 28014);
        throw new Error('Formato de data inválido')
      }

      const result = await Sale.create({
        seller_id: user_id,
        buyer_id: buyer_id,
        dt_sale: dt_sale
      })
      transaction.finish();

      logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(result));

      return res.status(201).send({ 'created': "id-" + result.id })

    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      if (error.message.includes('sales_seller_id_fkey')) {
        logger.error("seller_id inexistente. CodeError: " + 28015);
        return res.status(404).send({ message: "seller_id inexistente" })
      }
      if (error.message.includes('sales_buyer_id_fkey')) {
        logger.error("buyer_id inexistente. CodeError: " + 28016);
        return res.status(404).send({ message: "buyer_id inexistente" })
      }

      if (error.message.includes('invalid input syntax')) {
        logger.error("User_id em formato inválido. CodeError: " + 28017);
        return res.status(400).send({ message: "User_id em formato inválido" })
      }

      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${28018}`);
      res.status(400).send({ message: error.message })
    }
  },


  async showSaler(req, res) {

    const transaction = Sentry.startTransaction({
      op: "Vendas",
      name: "Endpoint que buscar as vendas do usuario.",
    });
    // #swagger.tags = [' Vendas ']
    // #swagger.description = 'Endpoint que buscar as vendas do usuario.'

    const { id } = req.params;
    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const findUser = await User.findByPk(id);

      const findSaler = await User.findAll({
        attributes: ['name', 'email'],
        include:
        {
          association: 'sales_user',
          attributes: ['seller_id', 'dt_sale'],
          where: { seller_id: id },
        }
      });

      if (!findUser) {
        logger.error("Este usuario não existe!. CodeError: " + 28019);
        return res.status(400).send({ message: "Este usuario não existe!" });
      }
      if (findSaler.length === 0) {
        logger.error("Este usuario não possui vendas. CodeError: " + 28020);
        return res.status(400).send({ message: "Este usuario não possui vendas!" });
      }
      transaction.finish();
      logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(findSaler));

      return res.status(200).json(findSaler)
    } catch (error) {
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${28021}`);

      Sentry.captureException(error);
      transaction.finish();
      return res.status(400).send({ message: "Erro deconhecido!" })
    }
  },

  async showSaleById(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Sale",
      name: "Pega uma venda",
    });

    try {
      const sale_id = req.params.sale_id

      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      if (!sale_id) {

        logger.error("É necessário passar um Id de vendas Error: " + 28000);

        return res.status(400).send({ message: 'É necessário passar o ID de vendas' })
      }

      const sale = await Sale.findByPk(sale_id, {
        attributes: {
          exclude: ['createdAt', 'updatedAt'],

        },
        include: [
          {
            association: "products",
            attributes: [
              'product_id',
              'amount',
              'unit_price',
              [literal('unit_price * amount'), 'total'],
            ],
          },
          {
            association: "buyer",
            attributes: [
              'name',
            ]
          },
          {
            association: "seller",
            attributes: [
              'name',
            ]
          },
        ],
      });


      if (!sale) {
        logger.error("Não existe venda para este ID. CodeError: " + 28004)

        return res.status(404).send({ message: 'Não existe venda para este ID' })
      }
      const productIdList = sale.products.map(p => p.product_id)

      if (productIdList.length == 0) {
        logger.warn('Não existe produto para esta venda');
      }

      const productNames = await Product.findAll({
        attributes: ['id', 'name'],
        where: {
          id: productIdList,
        }
      })

      const productsWithName = sale.products.map(p => {
        const { dataValues: product } = p;
        return {
          name: productNames.find(e => e.id === product.product_id).name,
          amount: product.amount,
          unit_price: product.unit_price,
          total: product.total,
        }
      })


      const response = {
        id_sale: sale.id,
        seller_name: sale.seller.name,
        buyer_name: sale.buyer.name,
        dt_sale: sale.dt_sale,
        products: productsWithName
      }
      transaction.finish();

      logger.info('Request: ' + req.url + '  Requisição executada com sucesso! Payload: ' + JSON.stringify(response))
      return res.status(200).json(response)

    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${28002}`)
      return res.status(500).json(error.message)
    }
  },

  async showSalesByBuyer(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Vendas",
      name: "Endpoint pra buscar as vendas do usuario pelo buyer_id.",
    });
    // #swagger.tags = ['Vendas']
    // #swagger.description = 'Endpoint pra buscar as vendas do usuario pelo buyer_id.'
    const { user_id } = req.params;

    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const salesData = await User.findAll({
        attributes: ['id', 'name', 'email'],
        include: [
          {
            association: "buyer_sales",
            attributes: ['seller_id', 'buyer_id', 'dt_sale'],
            where: {
              buyer_id: user_id,
            }
          }
        ]
      });

      if (salesData.length == 0) {
        logger.warn('No content');
        return res.status(204).json({ message: "no content" });
      }
      transaction.finish();

      logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(salesData));
      return res.status(200).json(salesData);

    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição já que não foi possível listar os dados das vendas. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${28022}`);
      return res.status(404).json({ message: "erro ao listar dados de vendas" });
    }
  },

  async deliveries(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Vendas",
      name: "Endpoint pra buscar as entregas",
    });
    // #swagger.tags = ['Vendas']
    // #swagger.description = 'Endpoint pra buscar as entregas.'
    /*  #swagger.parameters['obj'] = {
            in: 'body',
            schema: {
                address_id: 'integer',
                delivery_forecast: '2022-03-12T11:13:24.848Z'
            }
    } */
    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);

      const { sale_id } = req.params;
      const { address_id, delivery_forecast } = req.body;

      if (address_id.length == 0) {
        logger.warn(`Esta requisição não foi bem sucessida. CodeError: ${28023}`);
        return res.status(400).json({ message: "Bad Request" });
      }

      const sale = await Sale.findAll({
        where: {
          id: sale_id,
        }
      });

      if (sale.length == 0) {
        logger.error("id_sale not found. CodeError: " + 28024);

        return res.status(404).json({ message: "id_sale not found" });
      }

      const address = await Address.findAll({
        where: {
          id: address_id,
        }
      });

      if (address.length == 0) {
        logger.error("address_id not found. CodeError: " + 28025);
        return res.status(404).json({ message: "address_id not found" });
      }

      const dateNow = new Date();
      const dataParsed = Date.parse(dateNow);
      const dataForecastParsed = Date.parse(delivery_forecast);

      if (dataForecastParsed < dataParsed) {
        logger.warn(`Esta requisição não foi bem sucessida. CodeError: ${28026}`);
        return res.status(400).json({ message: "Bad request" });
      }

      const deliverydate = daysToDelivery(7);

      const deliveryBooked = await Delivery.findAll({
        where: {
          sale_id: sale_id,
        }
      });

      if (deliveryBooked.length >= 1) {
        logger.warn(`Já existe um agendamento de entrega para esta venda. CodeError: ${28027}`);
        return res.status(400).json({ message: "Já existe um agendamento de entrega para esta venda" });
      }

      const deliveryDateResult = await Delivery.create({
        address_id: address_id,
        sale_id: sale_id,
        delivery_forecast: deliverydate
      })
      transaction.finish();

      logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(deliveryDateResult));
      return res.status(200).json({ message: "Entrega agendada com sucesso" });
    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${28028}`);
      return res.status(400).json({ message: "Bad request" });
    }

  },

  async saleMade(req, res) {
    const transaction = Sentry.startTransaction({
      op: "Vendas",
      name: "Endpoint para registrar vendas de produtos.",
    });
    // #swagger.auto = false
    // #swagger.tags = ['Vendas']
    // #swagger.description = '<h2>Endpoint para registrar vendas de produtos.</h2>'
    /*  #swagger.parameters[seller_id] = {
              in: 'path',
              description: '<ul><li>Tem que ser um seller_id valido</li></ul>',
            
      } */
    /*  #swagger.parameters['obj'] = {
              in: 'body',
              description: '<h4>product_id</h4><ul><li>Tem que ser um product_id valido</li></ul><h4>unit_price</h4><ul><li>Se nenhum valor valor for enviado vai ser considerado a suggested_price da tabela de produtos.</li><li>O valor tem que ser maior que 0.</li></ul><h4>amount</h4><ul><li>Se nenhum valor valor for enviado vai ser considerado que é igual a 1.</li><li>O valor tem que ser maior que 0.</li></ul>',
              schema: {
                  $product_id: 2 ,
                  unit_price: 1800.79 ,
                  amount: 10
              }
    } */

    // #swagger.responses[201] = { description: 'Venda submetida com sucesso.' }
    // #swagger.responses[403] = { description: 'O usuário logado não tem autorização para este recurso.' }
    // #swagger.responses[404] = { description: 'product_id ou seller_id não existe no banco de dados.' }
    try {
      logger.info(`Iniciando a requisição. Request: ${req.url} `);


      const { seller_id } = req.params;
      const { product_id } = req.body;
      let { unit_price, amount } = req.body;
      const dt_sale = new Date();
      const buyer = await decode(req.headers.authorization);
      const buyer_id = buyer.userId;
      if (!amount) {
        amount = 1;
      }

      if (!product_id) {
        logger.warn(`Tem que enviar product_id. CodeError: ${28029}`);
        return res.status(400).send({ message: "Tem que enviar product_id" });
      }

      if (unit_price <= 0 || amount <= 0) {
        logger.warn(`Unit_price e amount tem que ser maior que 0. CodeError: ${28030}`);

        return res
          .status(400)
          .send({ message: "unit_price e amount tem que ser maior que 0" });
      }
      const validProductId = await Product.findByPk(product_id);

      if (!validProductId) {

        logger.error("Product_id não existe. CodeError: " + 28031);

        return res.status(404).send({ message: "product_id não existe" });
      }

      const validSellerId = await User.findByPk(seller_id);
      if (!validSellerId) {
        logger.error("seller_id não existe. CodeError: " + 28032);
        return res.status(404).send({ message: "seller_id não existe" });
      }

      if (!unit_price) {
        unit_price = validProductId.suggested_price;
      }
      const sale = await Sale.create({
        seller_id,
        buyer_id,
        dt_sale,
      });
      let sale_id = await sale.id;
      await sale.addProduct(product_id, { through: { unit_price, amount } });
      const productSale = await ProductsSales.findOne({
        attributes: ["id"],
        where: {
          sale_id: sale_id,
          product_id: product_id,
          unit_price: unit_price,
          amount: amount,
        },
      });
      transaction.finish();
      logger.info('Request: ' + req.url + ' Requisição executada com sucesso! Payload: ' + JSON.stringify(productSale));
      return res.status(201).json({ 'created': "id-" + productSale.id });
    } catch (error) {
      Sentry.captureException(error);
      transaction.finish();
      logger.error(`Desculpe, houve um erro sério, não conseguimos concluir a requisição. Request ${req.url} ${JSON.stringify(error)} . CodeError: ${28033}`);
      return res.status(400).send(error.message);
    }
  },
};
