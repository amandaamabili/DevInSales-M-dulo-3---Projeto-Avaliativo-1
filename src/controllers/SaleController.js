const Sale = require('../models/Sale')
const User = require("../models/User");
const ProductsSales = require("../models/ProductsSales");
const Product = require("../models/Product");
const { decode } = require("jsonwebtoken");
const salesRoutes = require('../routes/v1/sales.routes');
const { validateErrors } = require('../utils/functions')

module.exports = {

    async create(req, res) {
        
        const { user_id } = req.params
        const { buyer_id, dt_sale, } = req.body
        const receivedDate = new Date(dt_sale)
        const dateNow = new Date()
        try {
            const result = await Sale.create({
                seller_id: user_id,
                buyer_id: buyer_id,
                dt_sale: (receivedDate.length > 0) ? receivedDate : dateNow.getTime()
            })
            res.status(201).send({ 'created': "id-" + result.id })
        } catch (error) {
            if (error.message == `insert or update on table "sales" violates foreign key constraint "Sales_seller_id_fkey"`) return res.status(404).send("user_id inexistente")
            if (error.message == `insert or update on table "sales" violates foreign key constraint "Sales_buyer_id_fkey"`) return res.status(404).send("buyer_id inexistente")
            res.status(404).send(error.message)
        }

    },

    async showSaler(req, res) {

        const FindUser = await Sale.findAll()
        console.log(FindUser)
        return res.status(201).json(FindUser)

    },

    async showSaleById(req, res) {

        try {
            const sale_id = req.params.sale_id

            if (!sale_id) {
                return res.status(400).send({ message: 'É necessário passar o ID de vendas' })
            }

            const sale = await Sale.findByPk(sale_id)
            if (!sale) {
                return res.status(404).send({ message: 'Não existe venda para este ID' })
            }

            return res.status(200).json(sale)

        } catch (error) {
            return res.status(500).json(error.message)
        }

    },
  async saleMade(req, res) {
    try {
      // #swagger.auto = false
      // #swagger.tags = ['Vendas']
      // #swagger.description = '<h2>Endpoint for submitting sales</h2>'
      /*  #swagger.parameters[seller_id] = {
                in: 'path',
                description: '<ul><li>It must be a valid seller_id</li></ul>'
        } */
      /*  #swagger.parameters['obj'] = {
                in: 'body',
                description: '<h4>product_id</h4><ul><li>It must be a valid product_id</li></ul><h4>unit_price</h4><ul><li>If no value is sent it will get the default value of product</li><li>The value must be greater than 0</li></ul><h4>amount</h4><ul><li>If no value is sent it will be considered equal to 1</li><li>The value must be greater than 0</li></ul>',
                schema: {
                    $product_id: 'Integer',
                    unit_price: 'Integer',
                    amount: 'Integer'
                }
      } */

      // #swagger.responses[201] = { description: 'Sale submitted successfully.' }
      // #swagger.responses[403] = { description: 'The user logged-in is unauthorized to submit sales.' }
      // #swagger.responses[404] = { description: 'product_id or seller_id were not found in the database.' }
      const { seller_id } = req.params;
      const { product_id } = req.body;
      let { unit_price, amount } = req.body;
      const dt_sale = new Date();
      const buyer = await decode(req.headers.authorization);
      const buyer_id = buyer.userId;
      // verifying if amount was sent
      if (!amount || amount.replace(/\s/g, "") == "") {
        amount = 1;
      }

      // verifying if product_id was sent
      if (
        !product_id ||
        product_id.replace(/\s/g, "") == "" ||
        product_id === "any"
      ) {
        return res.status(400).send({ message: "Invalid Product_id" });
      }

      // verifying if amount or unit_price have values greater than 0
      if (unit_price <= 0 || amount <= 0) {
        return res
          .status(400)
          .send({ message: "unit_price or amount aren't valid" });
      }

      // verifying if product_id exists in database
      const validProductId = await Product.findByPk(product_id);
      if (!validProductId) {
        return res.status(404).send({ message: "product_id does not exist" });
      }

      // verifying if seller_id exists in database
      const validSellerId = await User.findByPk(seller_id);
      if (!validSellerId) {
        return res.status(404).send({ message: "seller_id does not exist" });
      }

      // verifying if unit_price was sent
      if (
        !unit_price ||
        unit_price.replace(/\s/g, "") == "" ||
        unit_price === "any"
      ) {
        unit_price = validProductId.suggested_price;
      }
      //Creating Product_Sale
      const sale = await Sale.create({
        seller_id,
        buyer_id,
        dt_sale,
      });
      let sale_id = await sale.id;
      await sale.addProduct(product_id, { through: { unit_price, amount } });
      productSale = await ProductsSales.findOne({
        attributes: ["id"],
        where: {
          sale_id: sale_id,
          product_id: product_id,
          unit_price: unit_price,
          amount: amount,
        },
      });
      return res.status(201).send({ message: productSale });
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },
};
