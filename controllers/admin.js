const Product = require('../models/product');
// const ObjectId = require('mongodb').ObjectId;


const fileHelper = require('../utils/file');
const {validationResult} = require('express-validator');
exports.getAddProducts = (req, res, next) => {
    res.render("admin/edit-product.ejs", {
        pagetitle: "add-product",
        page: 'add-product',
        editing : false,
        isAuthenticated : req.session.isloggedin,
        hasError : false,
        errorMessage : null
    });
};
exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const imageUrl = req.file;
    const errors = validationResult(req);
    if(!imageUrl){
        return res.status(422).render('admin/edit-product.ejs', 
        { product: {
            title : title,
            price : price,
            description : description
        }, 
        pagetitle: "Edit Product",
        path: '/admin/edit-product', 
        isAuthenticated : req.session.isloggedin,
        hasError : true,
        editing : false,
        errorMessage : "attached file is not an image"
        });
    }
    if(!errors.isEmpty()){
        console.log(errors.array())
        return res.status(422).render('admin/edit-product.ejs', 
        { product: {
            title : title,
            price : price,
            description : description,
            imageUrl : imageUrl
        }, 
        pagetitle: "Add Product",
        path: '/admin/', 
        isAuthenticated : req.session.isloggedin,
        hasError : true,
        editing : false,
        errorMessage : errors.array()[0].msg
        });
    }
    const product = new Product({
        title : title,
        price : price,
        description : description,
        imageUrl : imageUrl.path,
        //mongooose will automatically take the id from req.user
        userId : req.user._id
    });
    product.save().then(result=>{
        res.redirect('/admin/products');
    }).catch(err=>{
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }); 
};

exports.getProducts = (req, res, next) => {
    Product.find({userId : req.user._id.toString()})
    // will find title and price but not id
    // .select('title price -_description')
    //will also find the details of user which was embedded document and give name of user
    // .populate('userId' , 'name')
    .then(products => {
        res.render('admin/products.ejs', { prods: products, pagetitle: "admin products", path: '/admin/products', isAuthenticated : req.session.isloggedin});
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getEditProducts = (req , res , next) =>{
    const id = req.params.productID;
    const editmode = req.query.edit;
    if(editmode == 'false'){
        return res.redirect('/');
    }
    Product.findById(id).then(product=>{
        console.log(product);
        res.render('admin/edit-product.ejs' , {
            pagetitle : 'edit-product',
            editing : true,
            product : product,
            isAuthenticated : req.session.isloggedin,
            hasError : false,
            errorMessage : null
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postEditProduct = (req , res , next) =>{
    const productID = req.body.productID; 
    const updatedTitle = req.body.title;
    const updatedDescription = req.body.description;
    const updatedPrice = req.body.price;
    const image = req.file;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array())
        return res.status(422).render('admin/edit-product.ejs', 
        { product: {
            title : updatedTitle,
            price : updatedPrice,
            description : updatedDescription,
            imageUrl : updatedURL,
            _id : productID
        }, 
        pagetitle: "Edit Product",
        path: '/admin/edit-product', 
        isAuthenticated : req.session.isloggedin,
        hasError : true,
        editing : true,
        errorMessage : errors.array()[0].msg
        });
    }
    Product.findById(productID).then(product => {
        if(product.userId.toString() !== req.user._id.toString()){
            return res.redirect('/');
        }
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDescription;
        if(image){
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = image.path;
        }
        product.save()
        .then(result=>{
            // console.log(result);
            res.redirect('/admin/products');
        })
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.deleteProduct = (req , res , next) => {
    const id = req.params.id;
    Product.findById(id).then(product => {
        if(!product){
            return next(new Error('product not found'));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({_id : id , userId : req.user._id});
    })
    .then(result => {
        console.log(result);
        res.status(200).json({message : "success"})
    }).catch(err => {
        // const error = new Error(err);
        // error.httpStatusCode = 500;
        // return next(error);
        res.status(500).json({message : "deleting failed"})
    });
}