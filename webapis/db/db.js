var mongoose = require('mongoose');

var email = require("./models/email"),
    event = require("./models/event"),
    image = require("./models/image"),
    location = require("./models/location"),
    product = require("./models/product"),
    website = require("./models/website"),
    alert = require("./models/alert"),
    mailchimp = require("./models/mailchimp");


var db = mongoose.connect('mongodb://localhost/test');

var models = [
    event,
    image,
    location,
    product,
    website,
    alert,
    mailchimp
];


module.exports = { models: models, db: db };