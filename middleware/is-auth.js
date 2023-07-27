module.exports = (req , res , next) => {
    if(!req.session.isloggedin){
        return res.redirect('/login');
    }
    next();
}