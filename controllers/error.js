exports.notFound = (req,res,next)=>{
    // res.status(404).sendFile(path.join(__dirname,'views','404.html'));
    res.status(404).render("404.ejs" , {pagetitle : "Not found"})
};

exports.get500 = (req,res,next)=>{
    // res.status(404).sendFile(path.join(__dirname,'views','404.html'));
    res.status(500).render("500.ejs" , {
        pagetitle : "Technical error",
        isAuthenticated : req.isloggedin
    })
};