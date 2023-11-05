const express = require('express');

const isAuth = require('../middleware/is-auth');

const {body} = require('express-validator');

const router = express.Router();

const adminController = require('../controllers/admin.js');
router.get("/edit-profile" , isAuth , adminController.getEditProfile);
router.post("/edit-profile" , [
    body('name' , "Please enter a valid name").trim().isLength({min : 3}),
    body("email" , "Please enter a valid email").trim().isEmail().normalizeEmail(),
    body("phone" , "Please enter a valid phone number").trim().isNumeric().isLength({min : 10 , max : 10})
], isAuth , adminController.postEditProfile);

router.get('/delete-account' , adminController.deleteAccount);

router.get('/add-product', isAuth ,adminController.getAddProducts);

router.get('/edit-product/:productID' , isAuth ,  adminController.getEditProducts);

router.get('/products' , isAuth, adminController.getProducts);

router.post('/add-product' ,
[
    body('title' , "Please enter a valid title").isLength({min : 3}).trim(),
    body('price' , "Please enter a valid price").isFloat(),
    body('description' , "Description length should be in greater than 5 and less than 2000").isLength({min : 5 , max : 2000}).trim()
] ,isAuth , adminController.postAddProduct)

router.post('/edit-product' , 
[
    body('title' , "Please enter a valid title").trim().isLength({min : 3}),
    body('price' , "Please enter a valid price").isFloat(),
    body('description' , "Description length should be in greater than 5 and less than 2000").isLength({min : 5 , max : 2000}).trim()
], 
isAuth , adminController.postEditProduct);

router.delete('/product/:id' , isAuth , adminController.deleteProduct);

module.exports = router;