
const Product = require('../models/product');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const Order = require('../models/order');
const Review = require("../models/review");
// const stripe = require('stripe')('sk_test_51NX4AcSI0QNtFF7dckwSjY5HYQdDUAf0yHxPghKkihPPHCTBbk9ogrGjdMYVCVojjtunA1Wza0wdVDlN3UgAMptY00yTEfURQG');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const pdf = require('pdfkit');
const ITEMS_PER_PAGE = 10;
let total_items;
exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    Product.find()
        .countDocuments()
        .then(numPro => {
            total_items = numPro;
            return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            // console.log(products);
            res.render('shop/product-list.ejs', {
                prods: products, pagetitle: "home page",
                path: '/',
                isAuthenticated: req.session.isloggedin,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < total_items,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(total_items / ITEMS_PER_PAGE)
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProductDetails = (req, res, next) => {
    const productId = req.params.productID;
    const userId = req.user._id;
    let prod, prods;
    let user_bought_product = 0;
    Product.findById(productId)
        .then((product) => {
            prod = product;
            return Product.find()
        })
        .then(products => {
            prods = products
            return Order.find({ 'user.userId': userId })
        })
        .then(orders => {
            orders.forEach(order => {
                order.products.forEach(product => {
                    if (product.product._id.toString() === productId.toString()) user_bought_product = 1;
                })
            })
            return Review.find({ productId: productId })
        })
        .then(reviews => {
            res.render('shop/product-details.ejs', {
                user_bought_product: user_bought_product,
                product: prod,
                products: prods,
                pagetitle: prod.title,
                isAuthenticated: req.session.isloggedin,
                reviews: reviews
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
exports.postAddReview = (req , res , next) => {
    const prodId = req.body.productId;
    const desc = req.body.description;
    const stars = req.body.stars;
    const userId = req.user._id;
    const date = new Date();
    const name = req.body.name;
    const review = new Review({
        stars : stars,
        description : desc,
        userId : userId,
        productId : prodId,
        date : date,
        name : name
    })
    review.save()
    .then(result => {
        res.redirect("/products/" + prodId);
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
}

exports.postCart = (req, res, next) => {
    const id = req.body.id;
    let newQuantity = 1;
    Product.findById(id).then(product => {
        return req.user.addToCart(product);
    }).then(result => {
        // console.log(result);
        res.redirect('/cart');
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
};

exports.getCart = async (req, res, next) => {
    req.user.populate('cart.items.productId')
        .then(user => {
            console.log(user.cart.items);
            res.render('shop/cart', {
                products: user.cart.items,
                pagetitle: 'cart',
                path: "/cart",
                isAuthenticated: req.session.isloggedin
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};

exports.postDeleteCartItem = (req, res, next) => {
    const id = req.body.id;
    req.user.deleteFromCart(id)
        .then(result => {
            res.redirect('/cart');
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};

exports.postCheckout = (req, res, next) => {
    let products;
    let tot = req.body.amount;
    req.user.populate('cart.items.productId')
        .then(user => {
            products = user.cart.items;
            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(p => {
                    return {
                        price_data: {
                            currency: 'INR',
                            product_data: {
                                name: p.productId.title,
                                description: p.productId.description,
                            },
                            unit_amount: p.productId.price * 100,
                        },
                        quantity: p.quantity,
                    };
                }),
                mode: "payment",
                success_url: req.protocol + "://" + req.get('host') + '/checkout/success',
                cancel_url: req.protocol + "://" + req.get('host') + '/checkout/cancel'
            });
        })
        .then(session => {
            res.render('shop/checkout', {
                products: req.user.cart.items,
                pagetitle: 'checkout',
                path: "/checkout",
                isAuthenticated: req.session.isloggedin,
                totalCost: tot,
                sessionId: session.id
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};
exports.getCheckoutSuccess = (req, res, next) => {
    req.user.populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } };
            })
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user._id
                },
                products: products
            })
            return order.save()
        })
        .then(result => {
            req.user.cart = [{}];
            req.user.save().then(result => {
                res.redirect("/orders");
            })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
}

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders.ejs', {
                orders: orders,
                pagetitle: 'Your orders',
                path: '/orders',
                isAuthenticated: req.session.isloggedin
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId).then(order => {
        if (!order) {
            return next(new Error('No order found'));
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error("Unauthorized"));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);
        const pdfDoc = new pdf();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Desposition', 'inline; filename="' + invoiceName + '"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        pdfDoc.fontSize(26).text("invoice", {
            underline: true
        });
        pdfDoc.text("---------------------------");
        let tot = 0;
        let curr = 1;
        order.products.forEach(prod => {
            tot += prod.quantity * prod.product.price;
            pdfDoc.fontSize(14).text(curr + "." + prod.product.title + " - " + prod.quantity + ' $' + prod.product.price);
            curr++;
        })
        pdfDoc.text('-----------------------------');
        pdfDoc.text("Total amount is : " + tot);
        pdfDoc.end();
    }).catch(err => {
        next(new Error(err));
    })
    // fs.readFile(invoicePath , (err , data)=>{
    //     if(err){
    //         return next(err);
    //     }
    //     res.setHeader('Content-Type' , 'application/pdf');
    //     res.setHeader('Content-Desposition' , 'inline; filename="' + invoiceName + '"');
    //     res.send(data);
    // })

}