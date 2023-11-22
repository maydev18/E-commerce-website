const Product = require('../models/product');
const User = require('../models/user');
const path = require('path');
const Order = require('../models/order');
const Review = require("../models/review");
const stripe = require('stripe')(process.env.STRIPE_KEY);
const ITEMS_PER_PAGE = 8;
const mail = require("../utils/sendmail");
const invoiceGenerator = require("../utils/invoice");
exports.getProducts = (req, res, next) => {
    let total_items;
    const page = +req.query.page || 1;
    Product.find()
        .countDocuments()
        .then(numPro => {
            total_items = numPro;
            return Product.find().skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            if(products.length === 0){
                return next(new Error("No products found"));
            }
            res.render('shop/product-list.ejs', {
                prods: products, pagetitle: "home page",
                path: '/',
                isAuthenticated: req.session.isloggedin,
                totalPages : Math.ceil(total_items/ITEMS_PER_PAGE),
                currentPage: page
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
exports.getProfile = (req , res , next) =>{
    User.findById(req.user._id)
    .then(user => {
        res.render("shop/profile.ejs" , {
            pagetitle : "profile",
            isAuthenticated : req.session.isloggedin,
            user : user
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}
exports.getProductDetails = (req, res, next) => {
    const productId = req.params.productID;
    let prod, prods;
    let user_bought_product = 0;
    Product.findById(productId)
        .then((product) => {
            prod = product;
            return Product.find()
        })
        .then(products => {
            prods = products
            return Order.find({ 'user': req.user? req.user._id : null})
        })
        .then(orders => {
            if(orders){
                orders.forEach(order => {
                    order.products.forEach(product => {
                        if (product.product._id.toString() === productId.toString()) user_bought_product = 1;
                    })
                })
            }
            return Review.find({ productId: productId })
        })
        .then(reviews => {
            return Promise.all(reviews.map(review => review.populate('userId')));
        })
        .then(userReviews => {
            res.render('shop/product-details.ejs', {
                user_bought_product: user_bought_product,
                product: prod,
                products: prods,
                pagetitle: prod.title,
                isAuthenticated: req.session.isloggedin,
                reviews: userReviews,
                userId : req.user ? req.user._id.toString() : null
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
    const review = new Review({
        stars : stars,
        description : desc,
        userId : userId,
        productId : prodId,
        date : date,
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
exports.deleteReview = (req , res , next) => {
    const id = req.body.id;
    const prodId = req.body.prodId;
    Review.deleteOne({_id : id})
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
        res.redirect('/cart');
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
};

exports.getCart = async (req, res, next) => {
    Order.deleteMany({user : req.user._id , products: { $exists: true, $size: 0 }})
    .then(result => {
        return req.user.populate('cart.items.productId');
    })
    .then(user => {
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
    let products , orderId;
    let tot = req.body.totalcost;
    const fname = req.body.fname;
    const lname = req.body.lname;
    const email = req.body.email;
    const phone = req.body.phone;
    const addr1 = req.body.addr1;
    const addr2 = req.body.addr2;
    const zip = req.body.zip;
    const state = req.body.state;
    const city = req.body.city;
    const country = req.body.country;
    const fullname = fname + ' ' + lname;
    const fulladdr = addr1 + " " + addr2 + " " + city + " " + state + " " + country + " " + zip;
    const order = new Order({
        fullname : fullname,
        email : email,
        phone : phone,
        fulladdress : fulladdr,
        user : req.user._id,
        date : new Date()
    })
    order.save()
    .then(order => {
        orderId = order._id;
        return req.user.populate('cart.items.productId');
    })
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
            success_url: req.protocol + "://" + req.get('host') + '/checkout/success?orderId='+orderId,
            cancel_url: req.protocol + "://" + req.get('host') + '/checkout/cancel?orderId='+orderId
        });
    })
    .then(session => {
        res.render('shop/checkout', {
            products: req.user.cart.items,
            pagetitle: 'checkout',
            path: "/checkout",
            isAuthenticated: req.session.isloggedin,
            sessionId: session.id,
            totalCost : tot,
            orderId : orderId
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
};
exports.getCheckoutSuccess = (req, res, next) => {
    let orderId = req.query.orderId;
    let order;
    let prods;
    Order.findById(orderId)
    .then(odr => {
        order = odr;
        return req.user.populate('cart.items.productId')
    })
    .then(user => {
        const products = user.cart.items.map(i => {
            return { quantity: i.quantity, product: { ...i.productId._doc } };
        })
        products.forEach(prod => {
            User.findById(prod.product.userId)
            .then(user => {
                const mailOptions = {
                    from: 'ms772254@gmail.com',
                    to: user.email,
                    subject: 'New Order',
                    text: 'Hey you got a new Order'
                };
                mail.mail(mailOptions);
            })
        }) 
        prods = products;
    })
    .then(result => {
        order.products = prods;
        return order.save()
    })
    .then(result => {
        req.user.cart = [{}];
        return req.user.save()
    })
    .then(result => {
        res.redirect("/orders");
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
}

exports.getOrders = (req, res, next) => {
    Order.find({ 'user': req.user._id })
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
        if (order.user.toString() !== req.user._id.toString()) {
            return next(new Error("Unauthorized"));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);
        const logoPath = path.join('images' , "pdflogo.PNG");
        invoiceGenerator(order , invoicePath , invoiceName , logoPath , res);
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
}
exports.getUserOrders = (req , res , next) => {
    let orderDetails = [];
    Order.find()
    .then(orders => {
        orders.forEach(order => {
            order.products.forEach(pro => {
                if(pro.product.userId.toString() === req.user._id.toString()){
                    let comp = false;
                    if(pro.completed) comp = true; 
                    orderDetails.push({
                        fname : order.fullname,
                        fulladdr : order.fulladdress,
                        phone : order.phone,
                        email : order.email,
                        quantity : pro.quantity,
                        productName : pro.product.title,
                        productId : pro.product._id.toString(),
                        date : order.date,
                        completed : comp,
                        orderId : order._id.toString()
                    })
                }
            })
        })
        res.render("shop/user-orders" , {
            pagetitle : "User Orders",
            isAuthenticated : req.session.isloggedin,
            orderDetails : orderDetails
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}
exports.postOrderCompleted = (req , res , next) => {
    const orderId = req.body.orderId;
    const productId = req.body.productId;
    Order.findById(orderId)
    .then(order => {
        order.products.forEach(product => {
            if(product.product._id.toString() === productId.toString()){
                product.completed = true;
                return order.save();
            }
        })
    })
    .then(prod => {
        res.redirect('/user-orders');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}