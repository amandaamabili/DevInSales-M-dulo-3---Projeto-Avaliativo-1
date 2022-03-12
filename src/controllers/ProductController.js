const Product = require("../models/Product");
const { validateErrors } = require("../utils/functions");
const { Op } = require("sequelize");
const {
  indexProductService,
  storeProductService,
  updateProductService,
  getProductById,
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
      const { name, price_min, price_max } = req.query;

      const products = await indexProductService(name, price_min, price_max);

      return res.status(200).send({ products });
    } catch (error) {
      const message = validateErrors(error);
      return res.status(400).send(message);
    }
  },
  async store(req, res) {
    //#swagger.tags = ['Produto']
    // #swagger.description = 'Endpoint para criar um novo produto. Fornecer um json no body com um nome no formato string e um preço sugerido no formato number, podendo ser decimal. Nesse endpoint o usuário deve ter permissão WRITE.'

    try {
      const newProduct = req.body;

      const product = await storeProductService(newProduct);

      return res.status(200).send({
        message: "Produto criado com sucesso!",
        novoProduto: {
          nome: product.name,
          preço_sugerido: product.suggested_price,
        },
      });
    } catch (error) {
      const message = validateErrors(error);
      return res.status(400).send(message);
    }
  },
  async putUpdate(req, res) {
    /*#swagger.tags = ['Produto']
    #swagger.description = 'Endpoint para atualizar todos as propriedades de um produto. Fornecer um json no body com um nome no formato string e um preço sugerido no formato number, podendo ser decimal. Neste endpoint o usuário logado deve ter permissão de UPDATE.'
    #swagger.parameters['product_id'] = {
      in: 'path',
      description: 'parâmetro id para buscar um produto para atualização',
      required: true,
      type: 'number',
    }*/

    try {
      const { product_id } = req.params;
      const { name, suggested_price } = req.body;

      if (!name) {
        throw new Error("O campo name, não foi enviado.");
      }
      if (!suggested_price) {
        throw new Error("O campo suggested_price, não foi enviado.");
      }
      if (Number(suggested_price) <= 0) {
        throw new Error("O campo suggested_price, deve ser maior que 0.");
      }

      const product = await updateProductService(
        product_id,
        name,
        suggested_price
      );

      if (!product) {
        return res.status(404).send({ message: "Produto não encontrado." });
      }

      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
      return res.status(400).send(message);
    }
  },
  async update(req, res) {
    /* #swagger.tags = ['Produto']
    #swagger.description = 'Endpoint para alterar apenas uma propriedade de um produto, name ou suggested_price. Fornecer um json no body com um nome no formato string ou um preço sugerido no formato number, podendo ser decimal. Neste endpoint o usuário logado deve ter permissão de UPDATE.'
    #swagger.parameters['id'] = {
      in: 'path',
      description: 'parâmetro id para buscar um produto para atualização',
      required: true,
      type: 'number',
    } */

    try {
      const { id } = req.params;
      const { name, suggested_price } = req.body;

      const updatedProduct = await updateProductService(
        id,
        name,
        suggested_price
      );

      if (!updatedProduct) {
        return res
          .status(404)
          .send({ message: `Não existe produto com o id ${id}` });
      }

      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
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
      const { id } = req.params;

      const product = await getProductById(Number(id));

      if (!product) {
        return res.status(404).send({ message: "Produto não encontrado." });
      }
      if (product.sales.length > 0) {
        throw new Error("Produto não pode ser deletado, produto já vendido.");
      }
      await product.destroy();

      return res.status(204).send();
    } catch (error) {
      const message = validateErrors(error);
      return res.status(400).send(message);
    }
  },
};
