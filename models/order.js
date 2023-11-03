const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    products : [
        {
            product : {type : Object },
            completed : {type : Boolean , default : false},
            quantity : {type : Number}
        }
    ],
    user : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    fullname : {
        type : String,
        required : true 
    },
    email : {
        type : String,
        required : true 
    },
    phone : {
        type : String,
        required : true 
    },
    fulladdress : {
        type : String,
        required : true 
    },
    date : {
        type : Date,
        required : true
    }
}); 

module.exports = mongoose.model('Order' , orderSchema);