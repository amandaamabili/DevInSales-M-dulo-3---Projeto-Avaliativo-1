const SaleController = require('../../controllers/SaleController');
const express = require('express');
const salesRoutes = express.Router();
const { onlyCanAccessWith } = require("../../middlewares/auth");
const { READ, WRITE, UPDATE, DELETE } = require("../../utils/constants/permissions");



salesRoutes.get('/sales', SaleController.showSaler);
//salesRoutes.get('/user/:user_id/buy', SaleController.showSalesByBuyer);

salesRoutes.post('/user/:user_id/sales', SaleController.create);


salesRoutes.get('/sales/:sale_id', SaleController.showSaleById);


salesRoutes.post("/sales/:seller_id/item", SaleController.saleMade);




module.exports = salesRoutes;