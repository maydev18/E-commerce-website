const User = require('../models/user');
const bcrypt = require('bcryptjs');
const mail = require('../utils/sendmail');
const crypto = require('crypto');

const {validationResult} = require('express-validator'); 
exports.getLogin = (req , res , next) => {
    let msg = req.flash("error");
    if(msg.length > 0){
        msg = msg[0];
    }
    else msg = null;
    res.render('auth/login.ejs' , {
        pagetitle : 'Login',
        path : '/login',
        isAuthenticated : req.session.isloggedin,
        errorMessage : msg,
        oldInput : {
            email : "",
            password : ""
        }
    });
};

exports.postLogin = (req , res , next) => {
    const email = req.body.email;
    const pass = req.body.pass;
    User.findOne({email : email}).then(user => {
        if(user){
            if(user.verified){
                bcrypt.compare(pass , user.password)
                .then(doMatched => {
                    if(doMatched){
                        req.session.isloggedin = true;
                        req.session.user = user;
                        res.cookie("imageUrl" , user.imageUrl);
                        req.session.save(err=>{
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    else{
                        req.flash('error' , "wrong password");
                        res.render('auth/login.ejs' , {
                            pagetitle : 'Login',
                            path : '/login',
                            isAuthenticated : req.session.isloggedin,
                            errorMessage : "wrong password",
                            oldInput : {
                                email : email,
                                password : pass
                            }
                        });
                    }
                })
            }
            else{
                generateVerifyToken(email , (user) => {
                    sendVerificationEmail(user , req.protocol + '://' + req.get('host'))
                    res.render('auth/verify-account.ejs' , {
                        pagetitle : "Verify Account",
                        isAuthenticated : false
                    })
                })
            }
        }
        else{
            req.flash('error' , "No account exists");
            res.redirect('/signup');
        }
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postLogout = (req , res , next) => {
    req.session.destroy((err)=>{
        console.log(err);
        res.redirect('/');
    })
};

exports.getSignup = (req , res , next) => {
    let msg = req.flash("error");
    console.log(msg);
    if(msg.length > 0){
        msg = msg[msg.length-1];
    }
    else msg = null;
    res.render('auth/signup.ejs' , {
        pagetitle : 'sign-up',
        path : '/sign-up',
        isAuthenticated : req.session.isloggedin,
        errorMessage : msg,
        oldInput : {email : "" , pass : "" , cnfPass : ""}
    });
};
const generateVerifyToken = (email , cb) => {
    crypto.randomBytes(32 , (err , buffer)=>{
        if(err){
            console.log(err);
            return res.redirect('/login');
        }
        const token = buffer.toString('hex');
        User.findOne({email : email})
        .then(user => {
            user.token = token;
            user.tokenExpirationTime = Date.now() + 3600000;
            return user.save();
        })
        .then(user => {
            cb(user);
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    })
}
const sendVerificationEmail = (user , url) => {
    url = url + "/verify/" + user.token;
    const mailOptions = {
        from: 'ms772254@gmail.com',
        to: user.email,
        subject: 'Verify Your Account',
        html : `
            <p>Please click <a href = ${url}>here</a> to verify your email </p>
        `
    };
    mail.mail(mailOptions);
}
exports.postSignup = (req , res , next) => {
    const email = req.body.email;
    const pass = req.body.pass;
    const cnfPass = req.body.cnfPass;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render('auth/signup.ejs' , {
            pagetitle : 'sign-up',
            path : '/sign-up',
            isAuthenticated : req.session.isloggedin,
            errorMessage : errors.array()[0].msg,
            oldInput : {email : email , password : pass , cnfPass : cnfPass}
        });
    }
    User.findOne({email : email}).then(userDoc => {
        if(userDoc){
            req.flash('error' , "user already exists");
            return res.redirect('/login');
        } 
        else if(pass != cnfPass){
            req.flash('error' , "please enter the same password");
            return res.redirect('/signup');
        }
        else{
            return bcrypt.hash(pass , 12).then(hashedpass=>{
                const user = new User({
                    email : email,
                    password : hashedpass,
                    cart : {items : []},
                });
                return user.save();
            })
            .then(result => {
                generateVerifyToken(result.email , ( user =>{
                    sendVerificationEmail(user , req.protocol + '://' + req.get('host'))
                    res.render('auth/verify-account.ejs' , {
                        pagetitle : "Verify Account",
                        isAuthenticated : false
                    })
                }));
            })
            // .then(result => {
            //     
            //     res.redirect('/login');
            // })
        }
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
}
exports.verifyProfile = (req , res , next) => {
    const token = req.params.token;
    User.findOne({token : token , tokenExpirationTime : {
        $gte : new Date().toISOString()
    }})
    .then(user => {
        if(!user){
            req.flash('error' , 'no such token found');
            return res.redirect('/login');
        }
        user.verified = true;
        return user.save()
    })
    .then(user => {
        const mailOptions = {
            from: 'ms772254@gmail.com',
            to: user.email,
            subject: 'Welcome user',
            text: 'indian-shop(dot)com welcomes yous to our e-commerce website. You can now purchase products or sell your own'
        };
        mail.mail(mailOptions);
        res.render('auth/account-verified.ejs' , {
            pagetitle : 'Account verified successfully',
            isAuthenticated : false,
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
}
exports.getReset = (req , res , next) => {
    let msg = req.flash("error");
    if(msg.length > 0){
        msg = msg[0];
    }
    else msg = null;
    res.render('auth/reset.ejs' , {
        pagetitle : 'reset',
        path : '/reset',
        isAuthenticated : req.session.isloggedin,
        errorMessage : msg
    });
}

exports.postReset = (req , res , next) => {
    crypto.randomBytes(32 , (err , buffer)=>{
        if(err){
            console.log(err);
            return res.redirect('/login');
        }
        const token = buffer.toString('hex');
        User.findOne({email : req.body.email}).then(user => {
            if(!user){
                req.flash('error' , 'no account with such email found');
                return res.redirect('/reset');
            }
            user.token = token;
            user.tokenExpirationTime = Date.now() + 3600000;
            return user.save();
        })
        .then(result => {
            url = req.protocol + '://' + req.get('host') + "/reset/" + token;
            const mailOptions = {
                from: 'ms772254@gmail.com',
                to: req.body.email,
                subject: 'Reset Password',
                html : `
                    <p>You requested a password reset </p>
                    <p>Click this <a href = ${url}> click  </a> </p>
                `
            };
            mail.mail(mailOptions);
            res.redirect('/');
            
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    });
};

exports.getResetPassword = (req , res , next) => {
    let msg = req.flash("error");
    if(msg.length > 0){
        msg = msg[0];
    }
    else msg = null;
    const token = req.params.token;
    User.findOne({token : token , tokenExpirationTime : {
        $gte : new Date().toISOString()
    }}).then(user => {
        if(!user){
            req.flash('error' , 'no such token found');
            return res.redirect('/reset');
        }
        res.render('auth/setNewPassword.ejs' , {
            pagetitle : 'New Password',
            path : '/new-password',
            isAuthenticated : req.session.isloggedin,
            errorMessage : msg,
            userId : user._id.toString()
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
    
}
exports.postSetNewPassword = (req , res , next) => {
    const newpass = req.body.pass;
    const userId = req.body.userId;
    console.log(userId);
    User.findOne({
        _id : userId,
        tokenExpirationTime : {
            $gte : new Date().toISOString()
        }
    })
    .then(user => {
        if(!user){
            req.flash('error' , 'no such token found');
            return res.redirect('/reset');
        }
        bcrypt.hash(newpass , 12)
        .then(hashedpass => {
            user.password = hashedpass;
            user.token = undefined;
            user.tokenExpirationTime = undefined;
            return user.save();
        })
    })
    .then(result => {
        res.redirect("/login");
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
};