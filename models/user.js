const mongoose = require('mongoose');

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


// const mongodb = require('mongodb');
// const { get } = require('../routes/shop');
// const ObjectId = mongodb.ObjectId;

// class User{
//     constructor(username , email ,cart ,  id){
//         this.username = username;
//         this.email = email;
//         this.cart = cart || {items : []};
//         this._id = id;
//     }
//     save(){
//         const db = getDb();
//         return db.collection('users').insertOne(this);
//     }
//     addToCart(product){
//         const cartProductIndex = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString();
//         });
//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];
//         if(cartProductIndex >= 0){
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         }
//         else{
//             updatedCartItems.push({productId : new ObjectId(product._id) , quantity : 1});
//         }
//         const updatedCart = {
//             items : updatedCartItems
//         };
//         const db = getDb();
//         return db.collection('users').updateOne(
//             {_id : new ObjectId(this._id)},
//             {$set : {cart : updatedCart}},
//             {upsert : true}
//         )

//     }
//     static findById(id){
//         const db = getDb();
//         return db.collection('users').find({_id : new ObjectId(id)}).next();
//     }
//     async getCart(){
//         const db = getDb();
//         const productIds = this.cart.items.map(i => {
//             return i.productId;
//         });
//         const quantity1 = (p) => {
//             const j = this.cart.items.find(i => {
//                 return i.productId.toString() === p._id.toString()
//             })
//             return j.quantity;
//         }
//         const products = await db.collection('products').find({_id : {$in : productIds}}).toArray();
//         return products.map(p => {
//             return {
//                 ...p , quantity : quantity1(p)
//             }
//         });
//     }
//     deleteFromCart(id){
//         const updatedCartItems = this.cart.items.filter(item=>{
//             return item.productId.toString() !== id.toString();
//         })
//         const db = getDb();
//         return db.collection('users').updateOne(
//             {_id : new ObjectId(this._id)},
//             {$set : {cart : {items : updatedCartItems}}},
//             {upsert : true}
//         )
//     }
//     addOrder(){
//         const db = getDb();
//         return this.getCart().then(products => {
//             const order = {
//                 items : products,
//                 user : {
//                     _id : new ObjectId(this._id),
//                     name : this.name
//                 }
//             };
//             return db.collection('orders').insertOne(order);
//         })
//         .then(result=>{
//             this.cart = {items : []};
//             return db.collection('users').updateOne(
//                 {
//                     _id : new ObjectId(this._id),
//                 },
//                 {$set : {
//                     cart : {items : []}
//                 }}
//             );
//         }).catch(err => {
//             console.log(err);
//         });
//     }
//     getOrders(){
//         const db = getDb();
//         return db.collection('orders').find({
//             'user._id' : new ObjectId(this._id)
//         }).toArray();
//     }
// }

// module.exports = User;