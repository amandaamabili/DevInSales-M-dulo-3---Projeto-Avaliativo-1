const { Op } = require("sequelize");
const Product = require("../models/Product");
const ProductsSales = require("../models/ProductsSales");
const logger = require('../config/logger');


module.exports = {
  async indexProductService(name, price_min, price_max) {
    const query = {};
    if (name) {
      query.name = { [Op.iLike]: `%${name}%` };
    }
    const priceMin = Number(price_min) ? Number(price_min) : 0;
    const priceMax = Number(price_max)
      ? Number(price_max)
      : Number.MAX_SAFE_INTEGER;

    if (priceMax <= priceMin) {
      logger.warn(`O preço máximo deve ser maior que o preço mínimo. CodeError: ${21023}`);
      throw new Error("O preço máximo deve ser maior que o preço mínimo.");
    }
    query.suggested_price = {
      [Op.between]: [priceMin, priceMax],
    };

    const products = await Product.findAll({
      attributes: ["id", "name", "suggested_price"],
      where: query,
    });
    return products;
  },

  async storeProductService(newProduct) {
    const nameWithNoSpaces = newProduct.name.trim();

    const productExist = await Product.findOne({
      where: {
        name: nameWithNoSpaces,
      },
    });
    if (productExist) {
      logger.warn(`Já existe um produto com esse mesmo nome. CodeError: ${21024}`);
      throw new Error("Já existe um produto com esse mesmo nome.");
    }

    if (newProduct.suggested_price <= 0) {
      logger.warn(`O preço deve ser maior que zero. CodeError: ${21025}`);

      throw new Error("O preço deve ser maior que zero.");
    }

    return await Product.create(newProduct);
  },

  async updateProductService(id, name, suggested_price) {
    const nameWithNoSpaces = name ? name.trim() : null;

    if (!Number(id)) {
      logger.warn(`O id deve ser um número. CodeError: ${21026}`);
      throw new Error("O id deve ser um número.");
    }
    if (!nameWithNoSpaces && !suggested_price) {
      logger.warn(`Não foram enviados dados para atualização. CodeError: ${21027}`);
      throw new Error("Não foram enviados dados para atualização.");
    }

    if (nameWithNoSpaces) {
      const name_Db = await Product.findOne({
        where: {
          name: nameWithNoSpaces,
          id: {
            [Op.not]: id,
          },
        },
      });

      if (name_Db) {
        logger.error(`Já existe outro produto com o nome ${nameWithNoSpaces}. CodeError: ` + 21028);
        throw new Error(
          `Já existe outro produto com o nome ${nameWithNoSpaces}`
        );
      }
    }

    if (suggested_price <= 0) {
      logger.error(`O preço sugerido deve ser maior que zero. CodeError: ` + 21029);

      throw new Error("O preço sugerido deve ser maior que zero.");
    }

    const productExist = await Product.findByPk(id);
    if (!productExist) {
      logger.warn('Este produto não existe');
      return null;
    }

    productExist.name = nameWithNoSpaces || productExist.name;

    productExist.suggested_price =
      suggested_price || productExist.suggested_price;

    await productExist.save();

    return productExist;
  },

  async getProductById(id) {
    if (!Number(id)) {
      throw new Error("O id deve ser um número.");
    }
    return await Product.findByPk(id);
  },

  async countSalesByProductId(id) {
    if (!Number(id)) {
      logger.error("O id deve ser um número. CodeError: " + 21030);

      throw new Error("O id deve ser um número.");
    }
    return await ProductsSales.count({
      where: {
        product_id: id
      }
    })
  },
};
