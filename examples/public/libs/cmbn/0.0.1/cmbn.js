/* Copyright (c) 2012 Yahoo! Inc.  All rights reserved.
   Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms. */

;(function(){

/* was attempting the following formatters for gg and ms but the assets don't have enough consistency
 * e.g. jquery.ui/ver/jquery-ui.min.js (dot and dash interchanged), swfobject/ver/swfobject.js (no min)
function ajaxFormatter (prefix)
{
    return function (mod, ver)
    {
        return prefix + mod + '/' + ver + '/' + mod + '.min.js';
    }
}

function ajaxDeformatter (mod)
{
    var matches = new RegExp('/([a-z-]+)/([0-9ab\.]+)/[a-z-\.]+.js$').exec(mod);
    return matches ? [matches[1], matches[2]] : false;
}
*/

function yuiFormatter (mod, ver)
{
    return (ver || '3.5.1') + '/build/' + mod + '/' + mod + '-min.js';
}

function yuiDeformatter (mod)
{
    var matches = new RegExp('/([0-9ab\.]+)/build/([a-z-]+)/[a-z-]+.js$').exec(mod);
    return matches ? [matches[2], matches[1]] : false;
}

var cdns = {
        cb:  {host: 'cmbn.us'},
        cc:  {host: 'cdncss.com'},
        cj:  {host: 'cdnjs.cloudflare.com', prefix: 'ajax/libs/'},
        gg:  {host: 'ajax.googleapis.com', prefix: 'ajax/libs/'},
        gh:  {host: 'raw.github.com', protocol: 'https'},
        ms:  {host: 'ajax.aspnetcdn.com', prefix: 'ajax/'},
        yui: {host: 'yui.yahooapis.com', formatter: yuiFormatter, deformatter: yuiDeformatter}
    };

var methods =
{
    getCdnByHost: function (host)
    {
        var c, cdn;
        for (c in cdns)
        {
            cdn = cdns.hasOwnProperty(c) ? cdns[c] : {};
            if(cdn.host === host)
            {
                cdn.code = c;
                return cdn;
            }
        }
        return null;
    },
    
    getCdn: function (code)
    {
        return cdns[code];
    },
    
    addCdn: function (code, cdn)
    {
        cdns[code] = cdn;
    },
    
    // this doesn't really belong here but it's an easy place to stay DRY
    isFunc: function (o)
    {
        return typeof o === 'function';
    }
};

    var win = function(){ return this; }();
    win.cmbn = win.cmbn || {};
    win.cmbn.cdns = methods;

})();

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

    var win = function(){ return this; }(),
        cmbn = win.cmbn;
    
    if(cmbn)
    {
        var cdns = cmbn.cdns;
        cmbn.client = {combine: combine};
    }

})();
