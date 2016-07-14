var RestClient = require('node-rest-client').Client;
var client = new RestClient();

var ENDPOINT_BASE = "http://localhost:8000/";
var co = require('co');

function httppost (uri,options){
    return new Promise((resolve,reject)=>{
        client.post(uri,options,function(data){
            resolve(data);
        })
    })
}
function httpget (uri,options){
    return new Promise((resolve,reject)=>{
        client.get(uri,options,function(data){
            resolve(data+"");
        })
    })
}
co.wrap(function *() {
    console.log("1:normal function");
    console.dir(yield httppost(ENDPOINT_BASE + 'test/hello', {
        headers: {
            'Content-type': 'application/json'
        },
        data: [
            "test",
        ]
    }));
    console.log("2:auth required function without token");
    console.dir(yield httppost(ENDPOINT_BASE + 'test/_hello', {
        headers: {
            'Content-type': 'application/json'
        },
        data: [
            "test",
        ]
    }));
    console.log("3:token Get")
    var token = yield httppost(ENDPOINT_BASE + 'test/authenticate', {
        headers: {
            'Content-type': 'application/json'
        },
        data: [
            "admin",
            "wendi",
        ]
    });
    console.log("token:"+token);
    console.log("4:auth required function with token");
    console.dir(yield httppost(ENDPOINT_BASE + 'test/_hello', {
        headers: {
            'Content-type': 'application/json',
            'authorization': 'Bearer '+token,
        },
        data: [
            "test",
        ]
    }));
    console.log("5:public file");
    console.dir(yield httpget(ENDPOINT_BASE + 'testf/test.txt', {
        
    }));
    console.log("6:authed file(admin)");
    console.dir(yield httpget(ENDPOINT_BASE + 'testf/test.txt', {
        headers: {
            'Content-type': 'application/json',
            'authorization': 'Bearer '+token,
        },
    }));
    var token2 = yield httppost(ENDPOINT_BASE + 'test/authenticate', {
        headers: {
            'Content-type': 'application/json'
        },
        data: [
            "test",
            "wendi",
        ]
    });
    console.log("7:authed file(test)");
    console.dir(yield httpget(ENDPOINT_BASE + 'testf/test.txt', {
        headers: {
            'Content-type': 'application/json',
            'authorization': 'Bearer '+token2,
        },
    }));
    ;
})();