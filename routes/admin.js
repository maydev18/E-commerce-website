const express = require('express');

const path = require('path');

const isAuth = require('../middleware/is-auth');

const {check} = require('express-validator');

const router = express.Router();


const adminController = require('../controllers/admin.js');

//filtering the request using /admin

router.get('/add-product', isAuth ,adminController.getAddProducts);

router.get('/edit-product/:productID' , isAuth ,  adminController.getEditProducts);

router.get('/products' , isAuth, adminController.getProducts);

router.post('/add-product' ,
[
    check('title').isLength({min : 3}).trim(),
    check('price').isFloat(),
    check('description').isLength({min : 5 , max : 100}).trim()
] ,isAuth , adminController.postAddProduct)

router.post('/edit-product' , 
[
    check('title').isLength({min : 3}).trim(),
    check('price').isFloat(),
    check('description').isLength({min : 5 , max : 100}).trim()
], 
isAuth , adminController.postEditProduct);

router.delete('/product/:id' , isAuth , adminController.deleteProduct);

module.exports = {
    "router" : router,
}