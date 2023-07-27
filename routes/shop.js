const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');


const isAuth = require('../middleware/is-auth');

router.get('/', shopController.getProducts);

router.get('/products' ,shopController.getProducts);

router.get('/products/:productID' , shopController.getProductDetails);

router.get('/cart' , isAuth ,  shopController.getCart);

router.post('/add-to-cart' , isAuth , shopController.postCart);

router.post('/delete-cart-item' , isAuth ,  shopController.postDeleteCartItem);

router.get('/checkout' ,isAuth ,  shopController.getCheckout);
router.get('/checkout/success' ,isAuth ,  shopController.getCheckoutSuccess);
router.get('/checkout/cancel' ,shopController.getCheckout);
// router.post('/create-order' , isAuth ,  shopController.postCreateOrder);

router.get('/orders' , isAuth ,  shopController.getOrders);
router.get('/orders/:orderId' , isAuth , shopController.getInvoice);
module.exports = router;