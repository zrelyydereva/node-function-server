var fs = require('fs');
var bitCnt = '256'
module.exports = {
	prikey:fs.readFileSync('./assets/ec'+bitCnt+'-key-pri.pem'),
	pubkey:fs.readFileSync('./assets/ec'+bitCnt+'-key-pub.pem'),
	alg:"ES"+bitCnt
};