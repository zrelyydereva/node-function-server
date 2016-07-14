var nedb = require('nedb');
var hash = require('./hash.js');

var dbFile = "./data/_auth.nedb";
var logDbFile = "./data/_log.nedb";

var db = {};
db.auth = new nedb({
    filename: dbFile,
    autoload: true
});
db.log = new nedb({
    filename: logDbFile,
    autoload: true
});

module.exports = db;