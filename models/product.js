
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const productSchema = new Schema({
    title : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    imageUrl : {
        type : String,
        required : true
    },
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User',
        required : true
    }
});

module.exports = mongoose.model('Product' , productSchema);
//will be actually created as products(lowercase and a 's')











// const ObjectId = require('mongodb').ObjectId;

// class Product{
//     constructor(title , price , description , url ,id , prodId){
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.url = url;
//         this._id = id ? new ObjectId(id) : null;
//         this.prodId = prodId;
//     }
//     save(){
//         const db = getDb();
//         let dbop;
//         if(this._id){

//             dbop = db.collection('products').updateOne({_id : this._id} , {$set : this});
//         }
//         else{
//             dbop = db.collection('products').insertOne(this);
//         }
//         return dbop.then(res => {
//             console.log(res);
//         }).catch(err => {
//             console.log(err);
//         })
//     }
//     static fetchAll(){
//         const db = getDb();
//         return db.collection('products').find().toArray().then(products => {
//             // console.log(products);
//             return products;
//         }).catch(err => {
//             console.log(err);
//         });
//     }
//     static findById(id){
//         const db = getDb();
//         return db.collection('products').find({_id : new ObjectId(id)})
//         .next()
//         .then(product => {
//             console.log(product);
//             return product;
//         })
//         .catch(err => {
//             console.log(err);
//         });
//     }
//     static deleteById(userId , id){
//         const db = getDb();
//         return db.collection('products').deleteOne({_id : new ObjectId(id) })
//         .then(res=>{
//             return db.collection('users').updateOne(
//                 {_id : new ObjectId(userId)},
//                 {
//                     $pull : {
//                         'cart.items' : {
//                             productId : new ObjectId(id)
//                         }
//                     }
//                 }
//             )
//         })
//         .then(res => {
//             console.log(res);
//         })
//         .then(res => {
//             console.log(res);
//         }).catch(err=>{
//             console.log(err);
//         })
//     }
// }
// module.exports = Product;