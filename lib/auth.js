var db = require("./db.js");

var conf = require('../conf/jwt.conf.js');
var prikey = conf.prikey;
var pubkey = conf.pubkey;
var alg = conf.alg;
var jwt = require('./jwt.js')(prikey, pubkey, alg);
var hash = require("./hash.js");

module.exports = function auth(username, pwd, file) {
    return new Promise(function(resolve, reject) {
        process.nextTick(() => {
            if (!username) return reject({error:"Authentication Failed"});
            if (!pwd) return reject({error:"Authentication Failed"});
            db.auth.findOne({
                username: username,
                pwd: hash(pwd),
                validFrom: {
                    $lt: new Date()
                },
                validTo: {
                    $gt: new Date()
                },
                $or: [{
                    allow: "*"
                }, {
                    allow: file
                }],
            }, function(err, doc) {
                if (err) return reject({error:"Authentication Failed"});
                try{
                    delete doc.pwd;
                }catch(e){
                    return reject({error:"Authentication Failed"}); 
                }
                return resolve(jwt.sign(doc));
            })
        })
    })
}