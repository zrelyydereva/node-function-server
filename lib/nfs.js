// -------------------------
// Node Function Server 
// Main Module
// 2016.07 @ZrelyyDereva kalanchoe.space
// -------------------------
var path = require('path');
var fs = require('fs');
var vm = require('vm');
var auth = require('./auth.js');
var logger = require("./logger.js");
module.exports = function(argv) {

    var _argv = argv;
    var _scripts = {};

    function getPathInfo(filepath) {
        var tmp;
        try {
            return fs.statSync(filepath);
        } catch (ex) {
            return null;
        }
    }

    return function srvMain(request, response, next) {
        logger.log("INFO", "request Incoming", {
            path: request.path,
            query: JSON.parse(JSON.stringify(request.query)),
            data: JSON.parse(JSON.stringify(request.body)),
            ip: request.headers['x-forwarded-for'] ||
                request.connection.remoteAddress
        });
        if(request.path=="/") request.path="/index.html";
        
        var paths = (decodeURIComponent(request.path)).substring(_argv.mount.length).split("/");

        var pathPatterns = [];
        if (request.user && request.user.group) {
            pathPatterns.push(path.join("static", "group_" + request.user.group));
            pathPatterns.push(path.join("static", "authed"));
        }
        pathPatterns.push(path.join("static", "public"));


        //まず関数一致
        var fpath = _argv.userland;
        var nPath = path.join(fpath, "functions", paths[0] + ".js");
        var tmpStat = getPathInfo(nPath);
        if (tmpStat != null) {
            try {
                paths.push("");
                paths.push("");
                //関数だったとき
                var blnRefresh = false;
                //再読み込みの必要があるかないか
                if (!_scripts[nPath]) blnRefresh = true;
                if (_scripts[nPath] && _scripts[nPath].mtime < tmpStat.mtime) blnRefresh = true;
                if (blnRefresh) {
                    //再読み込み
                    var cont = {};
                    cont.require = require;
                    cont.console = console;
                    var notExpose = ",";
                    for (var k in global) {
                        if (typeof(global[k]) == "function") {
                            notExpose += (k + ",")
                            if (_argv.avoidFuncs.indexOf("," + k + ",") >= 0) continue;
                            cont[k] = global[k];
                        }
                    }
                    //認証関数は露出する
                    cont.authenticate = function authenticate(username, pwd) {
                        return auth(username, pwd, paths[0]);
                    }
                    _scripts[nPath] = {
                        script: new vm.Script(fs.readFileSync(nPath)),
                        context: vm.createContext(cont),
                        notExpose: notExpose,
                        mtime: tmpStat.mtime
                    };
                    //実行して、contextを作る
                    _scripts[nPath].script.runInContext(_scripts[nPath].context);
                    var readyFuncs = [];
                    for (k in _scripts[nPath].context) {
                        if (notExpose.indexOf(k) >= 0) continue;
                        readyFuncs.push(k);
                    }
                    //完了
                    logger.log("INFO", "Script Loaded " + paths[0] + "Loaded", {
                        readyFuncs: readyFuncs
                    });
                }
            } catch (e) {
                //ロード時のエラー
                logger.log("ERROR", "Errored on Loading " + paths[0] + " ", {
                    e
                });
                response.json({
                    error: "errored."
                });
                response.end();
                return next();
            }
            //関数を判定
            var command = paths[1];
            if (command == "") {
                response.json({
                    error: "function required"
                });
                response.end();
                return next();
            }
            if (!_scripts[nPath].context[command]) {
                response.json({
                    error: "function missing"
                });
                response.end();
                return next();
            }
            //露出しない関数だった場合は、同じようにエラーで返す
            if (_scripts[nPath].notExpose.indexOf(command) >= 0) {
                response.json({
                    error: "function missing."
                });
                response.end();
                return next();
            }
            var args = [];
            //クエリ文字列・POST引数は全部、関数の引数にする
            for (var k in request.query) {
                if (k == "token") continue;
                args.push((request.query[k] != "" ? request.query[k] : k));
            }
            for (var k in request.body) {
                args.push((request.body[k] != "" ? request.body[k] : k));
            }
            args = args.map(function(r){return (r.substring(0,1)=="{"?JSON.parse(r):r)})
            //ユーザ認証があれば
            var user = request.user || {};
            try {
                //アンスコ二つは呼び出し禁止
                if (command.substring(0, 2) == "__" ) {
                    logger.log("ERROR", "403 " + paths[0] + " " + command, {
                        user: (request.user ? request.user.username : ""),
                        file: paths[0],
                        function: paths[1]
                    });
                    response.json({
                        error: "something happend"
                    });
                    response.end();
                    return next();
                }
                //アンスコ始まりの関数は認証必要
                if (command.substring(0, 1) == "_" && !user.username) {
                    logger.log("ERROR", "Authentication Failed or Errored " + paths[0] + " " + command, {
                        user: (request.user ? request.user.username : ""),
                        file: paths[0],
                        function: paths[1]
                    });
                    response.json({
                        error: "authentication required."
                    });
                    response.end();
                    return next();
                }
                //関数を実行
                var argsx = Array(_scripts[nPath].context[command].length).fill("").map(function(v,i){ return (!args[i])?"":JSON.parse(JSON.stringify(args[i]))});
                if(_scripts[nPath].context[command].toString().replace(/\s/g,"").indexOf(",user){")==-1){
                    argsx.push(user || {});
                }else{
                    argsx.pop();
                    argsx.push(user || {});
                } 
                var ret = _scripts[nPath].context[command].apply(_scripts[nPath].context[command], argsx);
                if (ret && ret.then) {
                    //promiseが帰ってきたら、適当に処理する
                    ret.then(function(ret) {
                        logger.log("INFO", "Successflly Called (Promise) " + paths[0] + " " + command + " ", {
                            user: (request.user ? request.user.username : ""),
                            file: paths[0],
                            function: paths[1]
                        });
                        response.json(ret);
                        response.end();
                        return next();
                    }).catch(function(err) {
                        logger.log("ERROR", "Promise Caught " + paths[0] + " " + command + " ", {
                            user: (request.user ? request.user.username : ""),
                            err: err,
                            file: paths[0],
                            function: paths[1]
                        });
                        response.json(err);
                        response.end();
                        return next();
                    });
                    return;
                } else {
                    //Promiseでない場合はそのまま返却
                    logger.log("INFO", "Successflly Called " + paths[0] + " " + command + " ", {
                        user: (request.user ? request.user.username : ""),
                        file: paths[0],
                        function: paths[1]
                    });
                    response.json(ret);
                    response.end();
                    return next();
                }
            } catch (ex) {
                logger.log("ERROR", "Caught Exception" + paths[0] + " " + command + " ", {
                    user: (request.user ? request.user.username : ""),
                    file: paths[0],
                    function: paths[1]
                });
                response.json({
                    error: "something happend"
                });
                response.end();
                return next();
            }
        }
        //静的ファイルを返す
        //group_所属グループ>authed>publicの順に探す
        //ディレクトリ部分が一致するものを探す
        var stat = null;
        var xpath = "";
        for (var lpath of pathPatterns) {
            var tmp = getPathInfo(path.join(fpath, lpath, paths.join("/")));
            if (tmp != null && !tmp.isDirectory()) {
                stat = tmp;
                xpath = path.join(fpath, lpath, paths.join("/"));
                break;
            }
        }
        if (stat == null) {
            logger.log("ERROR", "404 on " + paths.join("/") + " ", {
                user: (request.user ? request.user.username:"")
            });
            response.state = 404;
            response.write("404 Not Found");
            response.end();
            return;
        }
        logger.log("INFO", "Static Resource Streamed Successflly " + paths.join("/") + " ", {
            user: (request.user?request.user.username:"")
        });

        return fs.createReadStream(xpath).pipe(response);
    }
}