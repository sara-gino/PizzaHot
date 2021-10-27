'use strict'
var app = module.exports = require('express')();
var bodyParser = require('body-parser');
const { create } = require('node-cookie');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.port || 3000;
var MongoClient=require('mongodb').MongoClient;
MongoClient.connect("mongodb://localhost:27017/db",function(err,db){
  if(err) {
  throw err;
  console.log(err)
}});
app.use('/users', require('./UserRouter.js'));
app.use('/orders', require('./OrderRouter.js'));
app.use('/products', require('./ProductRouter.js'));

app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + ' not found' })
});

app.listen(port, () => {
  console.log('server run');
});
