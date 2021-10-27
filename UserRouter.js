'use strict';
var validation = require('./middleware')
const express = require("express");
var router = express.Router();
module.exports = router;
var ObjectId = require('mongodb').ObjectID;
var sent = require('./SentMail');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('./config');

const MongoClient = require('mongodb').MongoClient
var db;
var Users;


MongoClient.connect("mongodb://localhost:27017/db", { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err)
    console.log('Connected')
    db = client.db('db')
    Users = db.collection('Users')
})

router.post('/register', [validation.validateUser, validation.UserIdExists], function (req, res) {
    var user = req.body;
    var token = jwt.sign({ id: user._id }, config.secret, {
        expiresIn: 86400 // expires in 24 hours
    });
    user.token = token;
    Users.insertOne({
        userName: user.userName,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        type: user.type,
        token: user.token
    }, function (err) {
        if (err) return res.status(500).send("There was a problem registering the user.")
    });
    sent.email(user.email, user.userName, 'registered')
    res
        .header('x-access-token', token)
        .send("You have successfully registered")
        .end();
});

router.get('/login', function (req, res) {
    Users.findOne({
        password: req.body.password,
        userName: req.body.userName
    })
        .then((result) => {
            if (!result) return res.status(404).send('No user found.');
            var token = jwt.sign({ id: result._id }, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });
            result.token = token;
            Users.findOneAndUpdate({ _id: ObjectId(result._id) }, {
                $set: {
                    token: result.token
                }
            }).then(() => {
                sent.email(result.email, result.userName, 'login')
                res
                    .header('x-access-token', result.token)
                    .send("You have successfully login")
                    .end();
            }).catch(error => console.error(error));

        })
        .catch(error => console.error(error));
})


router.put('/', [validation.FoundToken, validation.validateUser, validation.UserPost], (req, res) => {
    Users.findOneAndUpdate(
        { _id: ObjectId(req.body.id) },
        {
            $set: {
                userName: req.body.userName,
                password: req.body.password,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                phone: req.body.phone,
                type: req.body.type
            }
        }
    )
        .then(() => res.send("ok put"))
        .catch(error => console.error(error))
});

router.delete('/', [validation.FoundToken, validation.UserPost], (req, res) => {
    Users.deleteOne({ _id: ObjectId(req.body.id) })
        .then(() => {
            res.send("ok delete")
        })
        .catch(error => console.error(error))
});
router.get('/', validation.UserType,(req, res) => {
    Users.find().toArray()
        .then(result => {
            res.send(result);
        })
        .catch(error => console.error(error))
});
// router.get('/logout', function (req, res) {
//     res.status(200).send({ auth: false, token: null });
// });

module.exports = router