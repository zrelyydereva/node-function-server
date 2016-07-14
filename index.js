// -------------------------
// Node Function Server 
// Entry Point Module
// 2016.07 @ZrelyyDereva kalanchoe.space
// -------------------------

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');

var methodOverride = require('method-override');

var minimist = require('minimist');

var argv = minimist(process.argv.slice(2), {
  string: ['userland', 'port', 'mount', 'initialize', "avoidFuncs"],
  boolean: [
    'vervose',
    'debug'
  ],
  alias: {
    u: 'userland',
    m: 'mount',
    p: 'port',
    v: 'vervose',
    d: 'debug',
    a: 'avoidFuncs'
  },
  default: {
    userland: "./userland",
    mount: "/",
    port: 8000,
    vervose: true,
    debug: false,
    initialize: false,
    avoidFuncs: "eval"
  }
});

var port = argv.port;


//相対パスを絶対パスに変換
argv.userland = path.resolve(argv.userland);
argv.avoidFuncs = "," + argv.avoidFuncs + ",";
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(methodOverride());

//JWT関連
var conf = require('./conf/jwt.conf.js');
var prikey = conf.prikey;
var pubkey = conf.pubkey;
var alg = conf.alg;
var jwt = require('./lib/jwt.js')(prikey, pubkey, alg);
app.use(jwt.jwtexpress);

//どこから呼ばれてもOKにする。
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

//どうアクセスされても、nfsが処理
app.all(argv.mount + "*", require('./lib/nfs.js')(argv));

//Error Handling
app.use(function(err, req, res, next) {
  if (!res.headersSent) {
    res.status(err.status || 500);
  }
  console.dir(err);

  res.end(typeof(err) == "string" ? err : JSON.stringify(err));
});

//Start Listening
app.listen(port);
console.log("ready");