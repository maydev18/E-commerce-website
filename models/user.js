const mongoose = require('mongoose');
const Product = require('./product');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password : {
        type: String,
        required: true
    },
    name : {
        type: String,
    },
    phone : {
        type: String,
    },
    imageUrl : {
        type: String,
    },
    resetToken : String,
    tokenExpirationTime : Date,
    cart: {
        items: [{ productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, quantity: { type: Number, required: true } }]
    }
});

userSchema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    }
    else {
        updatedCartItems.push({ productId: product._id, quantity: 1 });
    }
    const updatedCart = {
        items: updatedCartItems
    };

    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.deleteFromCart = function(prodId){
    const updatedCart = this.cart.items.filter(item => {
        return item.productId.toString() !== prodId.toString();
    })
    this.cart.items = updatedCart;
    return this.save();
}

module.exports = mongoose.model('User', userSchema);