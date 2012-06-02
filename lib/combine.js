/* Copyright (c) 2012 Yahoo! Inc.  All rights reserved.
   Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms. */

;(function(){

var combine = function (urls, options)
{
    var opts = options || {},
        combined = '',
        lastCdn,
        segment;
    
    urls.forEach(function(u)
    {
        var ch = u.charAt(0);
        
        if('~' === ch)
        {
            segment = '/' + u;
        }
        else
        {
            var matches = new RegExp('^https?://([^/]+)([^?#]+)').exec(u),
                host = matches[1],
                path = matches[2],
                cdn = cdns.getCdnByHost(host) || [],
                c = cdn.code,
                asset;
            
            if(cdn)
            {
                var start = 1 + (cdn.prefix ? cdn.prefix.length : 0),
                    asset;
                
                asset = cdns.isFunc(cdn.deformatter) ? cdn.deformatter(path) : path.substr(start).replace(/\//g, ',');
                if(asset instanceof Array)
                {
                    c += '@' + asset[1];
                    asset = asset[0];
                }
                
                segment = (lastCdn === c ? '' : '/~' + c) + ';' + asset;
                lastCdn = c;
            }
        }
        
        combined += segment;
    });
    
    return (opts.protocol || 'http') + '://' + (opts.host || 'cmbn.us') + combined;
}

// STRIP
if(typeof module !== 'undefined')
{
    module.exports.combine = combine;
    var cdns = require('./cdns');
}
else
{
// END_STRIP
    var win = function(){ return this; }(),
        cmbn = win.cmbn;
    
    if(cmbn)
    {
        var cdns = cmbn.cdns;
        cmbn.client = {combine: combine};
    }
// STRIP
}
// END_STRIP

})();
