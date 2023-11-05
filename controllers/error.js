exports.notFound = (req,res,next)=>{
    res.status(404).render("404.ejs" , {
        pagetitle : "Not found",
        isAuthenticated : req.session.isloggedin
    })
};

exports.get500 = (req,res,next)=>{
    res.status(500).render("500.ejs" , {
        pagetitle : "Technical error",
        isAuthenticated : req.session.isloggedin
    })
};