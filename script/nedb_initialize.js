var nedb = require("nedb");

var path = require("path");
var fs = require("fs");

var dbFile = "./data/_auth.nedb";

var hash  = require("../lib/hash.js");

try{
    fs.unlinkSync(dbFile);
}catch(ex){
    console.log("delete file err"+ex);
}

var db = {};
db.auth = new nedb({filename:dbFile});

db.auth.loadDatabase();

var users = [
    {username:"admin",
     pwd:hash("wendi"),
     group:"admin",
     allow:"*",
     deny:false,
     validFrom:new Date("2000/01/01 00:00:00"),
     validTo:new Date("2999/12/31 23:59:59"),
    },
    {username:"test",
     pwd:hash("wendi"),
     group:"user",
     allow:["test"],
     deny:false,
     validFrom:new Date("2000/01/01 00:00:00"),
     validTo:new Date("2999/12/31 23:59:59"),
    }
]

users.forEach(user=>{
    console.dir(user);
    db.auth.insert(user);
})
