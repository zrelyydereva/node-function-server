var crypto = require("crypto");
module.exports = function hash(str){
    var sha512 = crypto.createHash('sha512');
    return sha512.update(str).digest('hex');
}