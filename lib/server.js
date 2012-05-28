var url = require('url'),
    md5 = require('MD5'),
    lru = require('lru-cache'),
    async = require('async'),
    request = require('request'),
    express = require('express'),
    gzippo = require('gzippo'),
    cdns = require('./cdns');

var middleware = function (options)
{
    var opts = options || {},
        cache = lru(opts.cacheSize || 5000000, opts.cacheFunc || function (item){ return item.length; });
    
    return function combine (req, res, next)
    {
        var assets = [],
            reqs = [],
            contentType = '',
            maxAge = null,
            regex = /\/(~.+)/,
            incoming = url.parse(req.url),
            matches = regex.exec(incoming.pathname),
            segments;
        
        if(matches)
        {
            segments = matches[1].split('/');
        }
        else
        {
            return next();
        }
        
        segments.forEach(function (segment)
        {
            var paths = segment.split(';'),
                cdnSem = paths.shift().substr(1).split('@'),
                cdnCode = cdnSem[0],
                ver = cdnSem[1] || null,
                cdn = cdns.getCdn(cdnCode),
                root;
            
            if(cdn)
            {
                root = (cdn.protocol || 'http') + '://' + cdn.host + '/' + (cdn.prefix || '');
                paths.forEach(function (path)
                {
                    var path = path.replace(/,/g, '/'),
                        url = root + (cdns.isFunc(cdn.formatter) ? cdn.formatter(path, ver) : path),
                        hash = md5(url),
                        asset = cache.get(hash) || {url: url, hash: hash, content: null};
                    
                    assets.push(asset);
                });
            }
            else
            {
                respond({msg: 'Invalid CDN', code: 400});
            }
        });
        
        assets.forEach(function (asset)
        {
            if(asset.content === null)
            {
                reqs.push(function(cb)
                {
                    request(asset.url, function (err, resp, body)
                    {
                        handleResp (err, resp, body, cb);
                    });
                });
            }
        });
        
        if(reqs.length)
        {
            async.parallel(reqs, respond);
        }
        else
        {
            respond();
        }
        
        function handleResp (err, resp, body, cb)
        {
            if (err || resp.statusCode !== 200)
            {
                respond({msg: 'Error fetching ' + resp.request.href, code: resp.statusCode});
            }
            else
            {
                var url =  resp.request.href,
                    type = resp.headers['content-type'],
                    cc = resp.headers['cache-control'],
                    maxAge = cc ? cc.match(/max\-age=([0-9]+)/) : null;
                
                // normalize
                if(type.match('javascript'))
                {
                    type = 'application/javascript';
                }
                
                // find asset by url and set content
                assets.forEach(function (asset, index, assets)
                {
                    if(asset.url === url)
                    {
                        asset.type = type;
                        asset.age = maxAge ? maxAge[1] : null;
                        asset.content = resp.body;
                        cache.set(asset.hash, asset);
                    }
                });
                
                cb();
            }
        }
        
        function respond (err, results)
        {
            if (err)
            {
                res.send(err.msg || "", err.code || 404);
                res.end();
            }
            else
            {
                var combined = '';
                
                assets.forEach(function (asset)
                {
                    combined += "\n" + asset.content;
                    
                    // set content type or use default if diff types were returned
                    if(asset.type !== contentType)
                    {
                        contentType = contentType ? 'text/plain' : asset.type;
                    }
                    
                    // set max age to a minimum of all assets
                    if(asset.age !== null)
                    {
                        maxAge = maxAge === null ? asset.age : Math.min(maxAge, asset.age);
                    }
                });
                
                res.setHeader('Content-Type', contentType);
                res.setHeader('Cache-Control', 'public,max-age=' + maxAge);
                
                res.write(combined);
                res.end();
            }
        }
    };
}

var createServer = function (options)
{
    var opts = options || {},
        app = express.createServer();
    
    // enable compression if available
    if(gzippo.compress)
    {
        app.use(gzippo.compress());
    }
    
    // add cmbn middleware
    app.use(middleware(opts));
    
    // optional dir for local assets that can be comboed
    if(opts.staticDir)
    {
        app.use(express.static(opts.staticDir, {maxAge: opts.staticMaxAge || 1e15}));
    }
    
    app.listen(opts.port || 80);
}

module.exports =
{
    middleware: middleware,
    createServer: createServer
}
