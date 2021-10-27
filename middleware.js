const { ObjectId } = require("bson");
const MongoClient = require('mongodb').MongoClient
let db;
let Orders;
let Users;
var jwt = require('jsonwebtoken');
var config = require('./config');
MongoClient.connect('mongodb://localhost:27017/db', { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err)
    console.log('Connected')
    db = client.db('db')
    Orders = db.collection('Orders')
    Users = db.collection('Users')
})
const isRequired = (value) => {
    return value === '' || value == 0 ? false : true;
}
const isEmailValid = (email) => {
    var regex = /^\w+@gmail.com$/;
    return regex.test(email);
}
const checkEmail = (emailValue) => {
    if (!isRequired(emailValue)) {
        return "שדה חובה";
    }
    if (!isEmailValid(emailValue)) {
        return "אימייל לא חוקי";
    }
    return null;
}

const isNameValid = (name) => {
    if (name.length > 20 || name.length < 2 || name[0] == ' ') {
        return false;
    }
    return (name.length)
}
const isNumValid = (num) => {
    var regex = /^[0-9]{1,9}$/;
    return regex.test(num);
}

const checkName = (nameValue) => {
    if (!isRequired(nameValue)) {
        return "שדה חובה";
    }

    if (!isNameValid(nameValue)) {
        return "שם לא חוקי"
    }
    return null;
}

const isPhonValid = (phon) => {
    if (phon.length != 10 && phon.length != 9) {
        return false;
    }
    if (phon[0] != "0") {
        return false;
    }
    return true;
}

const isPasswordValid = (password) => {
    var regex = /.{5,20}$/;
    return regex.test(password);

}
const checkPassword = (password) => {
    if (!isRequired(password)) {
        return "שדה חובה";
    }
    if (!isPasswordValid(password)) {
        return " הסיסמה לא חוקית סיסמה חוקית:5-20 "
    }
}
const checkPhon = (phonValues) => {
    if (!isRequired(phonValues)) {
        return "שדה חובה";
    }
    if (!isPhonValid(phonValues)) {
        return "מספר טלפון לא חוקי";
    }
    return null;
}

const checkNum = (num) => {
    if (!isRequired(num)) {
        return "שדה חובה";
    }
    if (!isNumValid(num)) {
        console.log(num)
        return "ערך לא חוקי"
    }
    return null;
}


const IfFoundOrder = (res, order) => {
    if (!order) return res.status(404).send('No order found.');
}
const IfFoundUser = (res, user) => {
    if (!user) return res.status(404).send('No user found.');
}
exports.FoundToken = (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(500).send('please connect');
    jwt.verify(token, config.secret, function (err) {
        if (err) return res.send("token not availabel")
    });
    next();
}
exports.validateUser = (req, res, next) => {
    const errors = {};
    values = req.body;
    const errorPass = checkPassword(values.password)
    const errorFname = checkName(values.firstName);
    const errorLname = checkName(values.lastName);
    const errorEmail = checkEmail(values.email);
    const errorPhon = checkPhon(values.phone);
    if (errorPass != null) {
        errors.password = errorPass;
    }
    if (errorFname != null) {
        errors.firstName = errorFname;
    }
    if (errorEmail != null) {
        errors.email = errorEmail;
    }
    if (errorLname != null) {
        errors.lastName = errorLname;
    }
    if (errorPhon != null) {
        errors.phone = errorPhon;
    }
    if (Object.entries(errors).length === 0) {
        next();
    }
    else {
        return res.send(errors)
    }
}

exports.validateOrder = (req, res, next) => {
    const errors = {};
    const errorId = checkNum(req.body.orderId);
    const errorDate = checkName(req.body.orderDate);
    if (errorId != null) {
        errors.orderId = errorId;
    }
    if (errorDate != null) {
        errors.orderDate = errorDate;
    }
    if (Object.entries(errors).length === 0) {
        next();
    }
    else {
        return res.send(errors)
    }
}

exports.validateProduct = (req, res, next) => {
    const errors = {};
    var values = JSON.parse(req.body.product);
    console.log(values);
    const errorAmount = checkNum(values.amount);
    const errorPrice = checkNum(values.price);
    const errorId = checkNum(values.productId);
    const errorName = checkName(values.name)
    if (errorName != null) {
        errors.name = errorName;
    }
    if (errorId != null) {
        errors.productId = errorId;
    }
    if (errorPrice != null) {
        errors.price = errorPrice;
    }
    if (errorAmount != null) {
        errors.amount = errorAmount;
    }
    if (Object.entries(errors).length === 0) {
        next();
    }
    else {
        return res.send(errors)
    }
}

exports.ProductIdExists = (req, res, next) => {
    Orders.findOne({ orderId: parseInt(req.body.orderId) })
        .then((result) => {
            var a = 0
            IfFoundOrder(res, result);
            var product1 = JSON.parse(req.body.product)
            result.products.map(product => {
                if (product.productId == product1.productId) {
                    a = 1
                }
            })
            if (a) {
                return res.send("This product is already available to order")
            }
            else {

                next()
            }
        }).catch(error => console.error(error));
}

exports.OrderIdExists = (req, res, next) => {
    Orders.findOne({ orderId: parseInt(req.body.orderId) })
        .then((result) => {
            if (result) {
                return res.send("This order is already available")
            }
            else {
                next()
            }
        }).catch(error => console.error(error));
}

exports.UserIdExists = (req, res, next) => {
    Users.findOne({
        password: req.body.password,
        userName: req.body.userName
    })
        .then((result) => {
            if (result) {
                return res.send('This user is already available')
            }
              next()
            
        }).catch(error => console.error(error));
}
exports.UserOrder = (req, res, next) => {
    Orders.findOne({ orderId: parseInt(req.body.orderId) })
        .then((orderToC) => {
            IfFoundOrder(res, orderToC);
            Users.findOne({ _id: ObjectId(orderToC.userId) })
                .then((userOfC) => {
                    IfFoundUser(res, userOfC);
                    var token = req.headers['x-access-token'];
                    Users.findOne({ token: token })
                        .then((userC) => {
                            IfFoundUser(res, userC);
                            if (userOfC.token == token || userC.type == "server") {
                                next()
                            }
                            else {
                                return res.send("You do not have permission to edit or read this order")
                            }
                        })

                }).catch(error => console.error(error));
        }).catch(error => console.error(error));
}
exports.UserPost = (req, res, next) => {
    Users.findOne({ _id: ObjectId(req.body.id) })
        .then((userToC) => {
            IfFoundUser(res, userToC);
            var token = req.headers['x-access-token'];
            Users.findOne({ token: token })
                .then((userC) => {
                    IfFoundUser(res, userC);
                    if (userToC.token == token || userC.type == "server") {
                        next()
                    }
                    else {
                        return res.send("You do not have permission to modify this client")
                    }
                }).catch(error => console.error(error));

        }).catch(error => console.error(error));
}
exports.UserType = (req, res, next) => {
    var token = req.headers['x-access-token'];
    Users.findOne({ token: token })
        .then((result) => {
            IfFoundUser(res, result);
            if (result.type == 'server') {
                next()
            }
            else {
                res.send("You need administrator privileges");
            }
        }).catch(error => console.error(error));
}
