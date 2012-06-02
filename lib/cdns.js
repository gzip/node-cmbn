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

// STRIP
if(typeof module !== 'undefined')
{
    module.exports = methods;
}
else
{
// END_STRIP
    var win = function(){ return this; }();
    win.cmbn = win.cmbn || {};
    win.cmbn.cdns = methods;
// STRIP
}
// END_STRIP

})();
