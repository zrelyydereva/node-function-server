var db = require("./db.js");

module.exports = {
    log: function log(level,message,data){
        db.log.insert({
            time:new Date(),
            level:level,
            message:message,
            data:data
        });
        console.log(level+" "+message);
        if(data) {
            console.dir(data)
            console.log("************");
        };
    }
}