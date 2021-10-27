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

router.delete('/ByProductId', [validation.FoundToken, validation.UserType], (req, res) => {
    Orders.find().toArray()
        .then(result => {
            result.map(order => {
                var totalPrice1 = order.totalPrice;
                var newProducts = [];
                order.products.map(product => {
                    if (product.productId != req.body.productId) {
                        newProducts.push(product);
                    }
                    else {
                        totalPrice1 -= (product.price * product.amount);
                    }
                })
                Orders.findOneAndUpdate({ orderId: order.orderId }, {
                    $set: {
                        products: newProducts,
                        totalPrice: totalPrice1
                    }
                }).then(() => {
                }).catch(error => console.error(error))
            })
            res.send("ok delete")
        })
        .catch(error => console.error(error))
});

router.get('/ByProductId', [validation.FoundToken, validation.UserType], (req, res) => {
    Orders.find().toArray()
        .then(result => {
            var amount = 0;
            result.map(order => {
                order.products.map(product => {
                    if (product.productId == req.body.productId) {
                        amount += product.amount;
                    }
                })
            })
            if(amount){
                res.send("total order from this product: " + amount)
            }
            else{
                res.send("This product has not been ordered in any order")
            }
 
        })
        .catch(error => console.error(error))
});

router.post('/ByOrderId', [validation.validateProduct, validation.UserOrder, validation.ProductIdExists], (req, res) => {
    var totalPrice1;
    var p = JSON.parse(req.body.product);
    Orders.findOne({ orderId: parseInt(req.body.orderId) })
        .then((result) => {
            totalPrice1 = result.totalPrice + (p.price * p.amount);
            Orders.findOneAndUpdate(
                { orderId: parseInt(req.body.orderId) }, {
                $push: {
                    products: { "productId": p.productId, "name": p.name, "price": p.price, "amount": p.amount }
                },
                $set: {
                    totalPrice: totalPrice1
                }
            }).then(() => {
                res.send("ok post")
            })
                .catch(error => console.error(error))
        })
        .catch(error => console.error(error))
});

router.put('/ByOrderId', [validation.FoundToken,validation.UserOrder], (req, res) => {
    var totalPrice1;
    var newProducts = [];
    Orders.findOne(
        {orderId: parseInt(req.body.orderId) })
        .then((result) => {
            if (!result) return res.status(404).send('No order found.');
            result.products.map(product => {
                if (product.productId != req.body.productId) {
                    newProducts.push(product);
                }
                else {
                    totalPrice1 = result.totalPrice - (product.price * product.amount);
                    var product1 = product;
                    product1.amount = parseInt(req.body.amount);
                    newProducts.push(product1);
                    totalPrice1 += (product.price * product1.amount);
                }
            })
            if(totalPrice1){
            Orders.findOneAndUpdate(
                { orderId: parseInt(req.body.orderId) }, {
                $set: {
                    products: newProducts,
                    totalPrice: totalPrice1
                }
            })
                .then(() => {
                    res.send("ok put")
                })
                .catch(error => console.error(error))
            }
            else{
                res.send("This product has not been ordered in this order")
            }
        }).catch(error => console.error(error))
});

router.delete('/ByOrderId', [validation.FoundToken,validation.UserOrder],(req, res) => {
    var totalPrice1;
    Orders.findOne({ orderId: parseInt(req.body.orderId) })
        .then((result) => {
            var newProducts = [];
            result.products.map(product => {
                if (product.productId != req.body.productId) {
                    newProducts.push(product);
                }
                else {
                    totalPrice1 = result.totalPrice - (product.price * product.amount);
                }
            })
            if(totalPrice1){
                Orders.findOneAndUpdate(
                    { orderId: parseInt(req.body.orderId) }, {
                    $set: {
                        products: newProducts,
                        totalPrice: totalPrice1
                    }
                })
                    .then(() => {
                        res.send("ok delete")
                    })
                    .catch(error => console.error(error))
                }
                else{
                    res.send("This product has not been ordered in this order")
                }
        })
        .catch(error => console.error(error))
});

router.get('/ByOrderId', [validation.FoundToken,validation.UserOrder],(req, res) => {
    Orders.findOne({ orderId: parseInt(req.body.orderId) })
        .then((result) => {
            res.send(result.products)
        })
        .catch(error => console.error(error))
});

module.exports = router
