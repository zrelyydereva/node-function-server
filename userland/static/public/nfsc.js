(function(global) {
    function objToParam(obj, prefix) {
        var ret = [];
        if (!prefix) prefix = "";
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                if (typeof(obj[k]) == "object") {
                    prefix += k + ".";
                    ret.push(objToParam(obj[k], prefix));
                } else {
                    ret.push(encodeURI(prefix + k) + "=" + encodeURI(obj[k]));
                }
            }
        }
        return ret.join("&");
    }

    function EncodeHTMLForm(data) {
        var params = [];
        for (var name in data) {
            var value = data[name];
            var param = encodeURIComponent(name) + '=' + encodeURIComponent(value);
            params.push(param);
        }
        return params.join('&').replace(/%20/g, '+');
    }

    global.$nfs = {};
    global.$nfs.call = function(url) {
        var args = Array.prototype.slice.call(arguments).splice(1).map(function(r) {
            return typeof(r) == "object" ? JSON.stringify(r) : r
        });
        var cb = args.pop();
        if (typeof(cb) !== "function") {
            args.push(cb)
            cb = null;
        }
        global.$nfs.post({
                url: url,
                data: args,
                method: "POST"
            },
            function(ret) {
                if (cb) cb(JSON.parse(ret));
            }
        )

    }
    global.$nfs.post = function $jhpPost(params, callback) {
        try {
            var r = new XMLHttpRequest();
            if (!params.url) params.url = "";
            if (!params.method) params.method = "GET";
            params.headers = params.headers || {};
            //   params.query = params.query || {};
            params.data = params.data || {};
            params.json = params.json || false;

            switch (params.method) {
                case "POST":
                case "DELETE":
                case "PATCH":
                case "GET":
                    var qs = objToParam(params.query, "");
                    if (qs != "") qs = "?" + qs;
                    r.open(params.method, params.url + qs, true);
                    //HTTPヘッダー付与、JSON ハイジャック対策
                    if (params.method != "GET") {
                        r.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                        r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        if (global.$nfs.token) {
                            r.setRequestHeader('authorization', 'Bearer ' + global.$nfs.token);
                        }

                    }
                    /*
                    for (var i in params.headers) {
                        r.setRequestHeader(i, params.headers[i]);
                    }
                    */
                    r.onreadystatechange = function() {
                        if (r.readyState != 4 || r.status != 200) return;
                        if (params.json) return callback(JSON.parse(r.responseText));
                        if (!params.json) return callback(r.responseText);
                    }
                    r.send(EncodeHTMLForm(params.data));
                    break;
                default:
                    throw "METHOD unknown";
            }
        } catch (ex) {
            throw ex;
        }
    }
    global.$nfs.escapeHtml = (function(String) {
        var escapeMap = {
            '&': '&amp;',
            '\x27': '&#39;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;'
        };

        function callbackfn(char) {
            if (!escapeMap.hasOwnProperty(char)) {
                throw new Error;
            }

            return escapeMap[char];
        }

        return function escapeHtml(string) {
            return String(string).replace(/[&"'<>]/g, callbackfn);
        };
    })(String);
    setTimeout(function() {
        if (global.onReady && typeof(global.onReady) == "function") global.onReady();
    }, 0);

})(window);