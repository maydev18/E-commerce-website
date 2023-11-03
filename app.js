const express = require("express");
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const app = express();
const notfound = require('./controllers/error.js');
const bodyParser = require('body-parser');
const multer = require('multer');
const User = require('./models/user');
const flash = require('connect-flash');
const csrf = require('csurf');
const cookieParser = require("cookie-parser");


// const helmet = require("helmet");
const compression = require("compression");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.xpmtenf.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});app.set('view engine', 'ejs');
app.set('views', 'views');//not needed as it is default.

// app.use(helmet());
app.use(cookieParser());
app.use(compression());

app.use(bodyParser.urlencoded({extended : false}));
const fileStorage = multer.diskStorage({
    destination : (req , file , cb)=>{
        cb(null , './images');
    },
    filename : (req , file , cb) => {
        cb(null , Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req , file , cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null , true);
    }
    else cb(null , false);
}
app.use(multer({
    storage : fileStorage,
    fileFilter : fileFilter
}).single('image'));

app.use(
    session({ name : "session-cookie" , maxAge: 1000 * 60 * 60 * 24 , secret: 'my secret', resave: false, saveUninitialized: false, store: store })
);

app.use(flash());

app.use((req, res, next) => {
    if (!req.session.user) {
        next();
    }
    else {
        User.findById(req.session.user._id).then(user => {
            req.user = user;
            next();
        }).catch(err => {
            next(new Error(err));
        });
    }
});

app.use('/admin', require("./routes/admin.js"));

app.use(require("./routes/shop.js"));

app.use(require("./routes/auth.js"));

app.use(express.static(path.join(__dirname, 'public')))//static middleware
app.use('/images' , express.static(path.join(__dirname, 'images')))//static middleware

app.get('/500' , notfound.get500);

//404 error page
app.use(notfound.notFound)

app.use((error , req , res , next)=>{
    // res.redirect('/500');
    console.log(error);
    res.status(500).render("500.ejs" , {
        pagetitle : "Technical error",
        isAuthenticated : req.session.isloggedin
    })
});
mongoose.connect(MONGODB_URI)
    .then(res => {
        app.listen(process.env.POST || 3000);
    })
    .catch(err => {
        console.log(err);
    })
