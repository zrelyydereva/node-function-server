//Userland Function Sample
function helloWorld(msg) {
    globalVar = msg;
    return msg;
}

function hello(msg) {
    return helloWorld(msg) + "!";
}


function promise() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            return resolve("ten second elipsed");
        }, 10000);
        return;
    });
}

function _hello() {
    return "12345x";
}