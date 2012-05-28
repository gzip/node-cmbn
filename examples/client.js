var cmbn = require('../index');

// add cdn for localhost
cmbn.cdns.addCdn('lh', {host: 'localhost:8080', prefix: 'libs/'});

// build a combined url, pointing to localhost, and log it
console.log(cmbn.client.combine([
    'http://cdnjs.cloudflare.com/ajax/libs/require.js/1.0.8/require.min.js',
    'http://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js',
    'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js',
    'http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.10/jquery-ui.min.js',
    'http://yui.yahooapis.com/3.5.1/build/yui-base/yui-base-min.js',
    'http://yui.yahooapis.com/3.5.1/build/oop/oop-min.js',
    'http://yui.yahooapis.com/3.5.1/build/features/features-min.js',
    'http://yui.yahooapis.com/3.5.1/build/dom-core/dom-core-min.js',
    'http://localhost:8080/libs/cmbn/0.0.1/cmbn.min.js'
], {host: 'localhost:8080'}));
