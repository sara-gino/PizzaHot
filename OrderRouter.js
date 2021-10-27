'use strict';
const express = require("express");
let router = express.Router()
var validation = require('./middleware')

const MongoClient = require('mongodb').MongoClient
let db;
let Orders;
let Users;

MongoClient.connect('mongodb://localhost:27017/db', { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err)
    console.log('Connected')
    db = client.db('db')
    Orders = db.collection('Orders')
    Users = db.collection('Users')
})
router.post("/",[validation.FoundToken,validation.validateOrder,validation.OrderIdExists], (req, res) => {
    var token = req.headers['x-access-token'];
    Users.findOne({ token: token })
    .then((result)=>{
        if (!result) return res.status(404).send('No user found.');
        Orders.insertOne({
            orderId: parseInt(req.body.orderId),
            userId: result._id,
            orderDate: req.body.orderDate,
            totalPrice: 0,
            products: JSON.parse(req.body.products)
        })
            .then(() => {
                Orders.findOne({orderId: parseInt(req.body.orderId)}) 
                .then((result)=>{
                    var totalPrice=0;
                    result.products.map(product=>{
                        totalPrice+=(product.price*product.amount)
                    })
                    Orders.findOneAndUpdate({orderId: parseInt(req.body.orderId)},{
                        $set:{
                            totalPrice: totalPrice, 
                        }
                    }).then(()=>{ res.send("ok post"); }) .catch(error => console.error(error))
                })  .catch(error => console.error(error))
            })
            .catch(error => console.error(error))
    })   .catch(error => console.error(error))
});

router.get('/',[validation.FoundToken,validation.UserType], (req, res) => {
            Orders.find().toArray()
                .then(result => {
                    res.send(result);
                })
                .catch(error => console.error(error))
});

router.get('/ByorderId',[validation.FoundToken,validation.UserOrder], (req, res) => {
    Orders.findOne({ orderId: parseInt(req.body.orderId) })
        .then(result => {
            if (!result) {
                res.send("order not exists.");
            }
            res.send(result);
        })
        .catch(error => console.error(error))

});

router.get('/ByToken',validation.FoundToken, (req, res) => {
    var token = req.headers['x-access-token'];
    Users.findOne({ token: token })
     .then((result)=>{
        if (!result) return res.status(404).send('No user found.');
        Orders.find({ userId: result._id }).toArray()
            .then(result => {
                if (!result) return res.status(404).send("No order found.");
                res.status(200).send(result);
            })
            .catch(error => res.status(500).send("There was a problem finding the orders."))

    }).catch(error => console.error(error));
});

router.put('/ByorderId',[validation.FoundToken,validation.UserOrder,validation.validateOrder], (req, res) => {
    Orders.findOneAndUpdate(
        { orderId:  parseInt(req.body.orderId) },
        {
            $set: {
                orderId: parseInt(req.body.orderId),
                orderDate: req.body.orderDate,
                products: JSON.parse(req.body.products)
            }
        })
        .then(() => {
            Orders.findOne({orderId: parseInt(req.body.orderId)}) 
            .then((result)=>{
                var totalPrice=0;
                result.products.map(product=>{
                    totalPrice+=(product.price*product.amount)
                })
                Orders.findOneAndUpdate({orderId: parseInt(req.body.orderId)},{
                    $set:{
                        totalPrice: totalPrice, 
                    }
                }).then(()=>{ res.send("ok put"); }) .catch(error => console.error(error))
            })  .catch(error => console.error(error))
        })
      
        .catch(error => console.error(error))
});

router.delete('/ByorderId',[validation.FoundToken,validation.UserOrder], (req, res) => {
    Orders.deleteOne({ orderId:  parseInt(req.body.orderId)})
        .then(() => {
            res.send("ok delete")
        })
        .catch(error => console.error(error))
});

module.exports = router