const express = require('express');

const router = express.Router();

const shopController = require('../controllers/shop');

const isAuth = require('../middleware/is-auth');

router.get('/', shopController.getProducts);
router.get("/profile" , shopController.getProfile);
router.get('/products' ,shopController.getProducts);

router.get('/products/:productID' , shopController.getProductDetails);
router.post("/submit-review" , isAuth , shopController.postAddReview);
router.post("/delete-review" , isAuth , shopController.deleteReview)
router.get('/cart' , isAuth ,  shopController.getCart);

router.post('/add-to-cart' , isAuth , shopController.postCart);

router.post('/delete-cart-item' , isAuth ,  shopController.postDeleteCartItem);

router.post('/checkout' ,isAuth ,  shopController.postCheckout);
router.get('/checkout/success' ,isAuth ,  shopController.getCheckoutSuccess);
router.get('/checkout/cancel' ,shopController.getCart);
// router.post('/create-order' , isAuth ,  shopController.postCreateOrder);

router.get('/orders' , isAuth ,  shopController.getOrders);
router.get('/orders/:orderId' , isAuth , shopController.getInvoice);
module.exports = router;