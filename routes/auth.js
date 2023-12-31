const express = require('express');

const router = express.Router();


const authController = require('../controllers/auth.js');

const {body} = require('express-validator');

router.get('/login' , authController.getLogin);

router.post('/login' ,[
    body('email').isEmail().withMessage("please enter a valid mail").normalizeEmail(),
    body('pass').trim()

] ,authController.postLogin);

router.get('/logout' , authController.postLogout);

router.get('/signup' , authController.getSignup);

router.post('/signup' , body('email').isEmail().withMessage("please enter a valid email").normalizeEmail(), body('pass').trim(),body("cnfPass").trim() , authController.postSignup);

router.get('/verify/:token' , authController.verifyProfile);

router.get('/reset' , authController.getReset);

router.post('/reset' , authController.postReset);

router.get('/reset/:token' , authController.getResetPassword);

router.post('/setNewPassword' , authController.postSetNewPassword);
module.exports = router;