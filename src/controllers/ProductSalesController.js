const Sale = require("../models/Sale");
const Product = require('../models/Product') 
const ProductsSales = require('../models/ProductsSales')
const { Op } = require("sequelize");
const { validateErrors } = require("../utils/functions");


module.exports = {
    async create(req,res){
        // #swagger.tags = ['Produtos_Vendas']
       // #swagger.description = 'Endpoint criar uma venda.'
       

   },
    async updateOne(req, res) {
    // #swagger.tags = ['Produtos_Vendas']
    // #swagger.description = 'Endpoint que atualiza a quantidade de produtos de uma venda.'
    try {
      const { sale_id, product_id, amount } = req.params;
      const saleResult = await Sale.findByPk(sale_id)
      const productResult = await Product.findByPk(product_id)
      const productSaleResult = await ProductsSales.findAll({
        //attributes: ['id', 'unit_price', 'amount', 'sale_id', 'product_id' ],
        where: {
          sale_id :{
            [Op.eq]:sale_id
          }
        }
      })
        if(!saleResult || !productResult){ //confere se id de Venda e de Produto existem no banco
        return res.status(404).send({ message: "id de Produto ou de Venda não existem" });

      }else{

        if(productSaleResult[0].dataValues.product_id!==Number(product_id)){ //confere se Produto repassado no Params é o mesmo cadastrado na Venda 
          return res.status(400).send({message:"Id do produto enviado não é compatível ao cadastrado na venda."});
        }else {
          if(amount<=0||isNaN(amount)){ //confere se Produto repassado no Params é o mesmo cadastrado na Venda 
            return res.status(400).send({message:"Quantidade deve ser um número superior à zero"});
          }
          const id = Number(productSaleResult[0].dataValues.id)

          const result = await ProductsSales.update(
            {amount: Number(amount)},
            {where: {id: id}}
          )

        return res.status(201).send({ message: "Venda atualizada com sucesso." });
        }
      }
      

    } catch (error) {
      const message = validateErrors(error);
      return res.status(400).send(message);
    }
  },
};
