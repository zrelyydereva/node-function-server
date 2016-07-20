// Module Of JWT

var jwtexpress = require('express-jwt');
var jwt = require('jsonwebtoken');

module.exports = function (privateKey, publicKey, algorithm) {
	var pubkey = publicKey;
	var prikey = privateKey;
	var alg = algorithm;
	return {
		jwtexpress : jwtexpress({
			secret : pubkey,
			algorithm : alg,
			credentialsRequired:false,
			getToken : function fromHeaderOrQuerystring(req) {
				if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
					return req.headers.authorization.split(' ')[1];
				} else if (req.query && req.query.token) {
					return req.query.token;
				}
			}
		}),
		sign : function (obj) {
			return jwt.sign(obj, prikey, {
				algorithm : alg,
				expiresIn : "2 days",
			})
		},
		verify : function (token) {
			return jwt.verify(token, pubkey, {
				algorithms : alg
			})
		},
	}
}
