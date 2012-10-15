/* Copyright (c) 2012 Yahoo! Inc.  All rights reserved.
   Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms. */

var liburl = require('url'),
    md5 = require('MD5'),
    lru = require('lru-cache'),
    async = require('async'),
    request = require('request'),
    express = require('express'),
    cdns = require('./cdns'),
    gzippo;

// fallback to connect for compress() if gzippo isn't available
try
{
    gzippo = require('gzippo');
}
catch (e)
{
    console.log('Notice: gzippo not found, using connect instead.');
    gzippo = require('connect');
}

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
            incoming = liburl.parse(req.url),
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
                
                // normalize js type
                if(type.match('javascript'))
                {
                    type = 'application/javascript';
                }
                // fix relative paths for css
                else if(type.match('css'))
                {
                    resp.body = fixCssPaths(url, resp.body);
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
        app.use(express.static(opts.staticDir, {maxAge: opts.staticMaxAge * 1000 || 1e15}));
    }
    
    app.listen(opts.port || 80);
}

var fixCssPaths = function (url, content)
{
    var regex = /url\(\s*(?:['"])?([^'")]+)(?:['"])?\s*\)/g,
        matches;
    
    while(matches = regex.exec(content))
    {
        var match = matches[0],
            path = matches[1],
            dirs = path.split('/');
        
        // skip canonical and data uris
        if('http' === dirs[0].substr(0, 4) || 'data:' === dirs[0].substr(0, 5))
        {
            continue;
        }
        
        // rebuild path
        content = content.replace(match, 'url(' + liburl.resolve(url, path) + ')');
    };
    
    return content;
}

module.exports =
{
    middleware: middleware,
    createServer: createServer
}
