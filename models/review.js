const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const reviewSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    stars : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    date : {
        type : Date,
        required : true
    },
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    productId : {
        type : Schema.Types.ObjectId,
        ref : 'Product',
        required : true
    }
});

module.exports = mongoose.model('Review' , reviewSchema);
//will be actually created as products(lowercase and a 's')
