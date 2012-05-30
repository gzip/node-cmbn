# cmbn

Several public CDNs host popular JS libs, most notably [cdnjs.com](http://www.cdnjs.com/).
Until now there was no easy way to combo the various libs into a single URL in order to maximize
performance. This package fills that gap by generating and serving combo URLs across
various CDNs and any other public server.

## Install

    $ npm i cmbn

## Usage

This software is currently demoed at cmbn.us but there are no guarantees to availability.
It's recommended to install cmbn on your own host in order to enable comboing with application-specific assets.
To maximize performance even further cmbn should be fronted by a CDN like [CloudFlare](http://www.cloudflare.com/).

### Standalone server

    var cmbn = require('cmbn');
    cmbn.server.createServer();

##### Options

In addition to the options available for `middleware` ,`createServer` accepts one or more of the following:

* `port` - Port to listen on. Default is 80.
* `staticDir` - Directory to serve static assets from. Particularly useful if comboing from localhost.
* `staticMaxAge` - Number of seconds to set for `maxAge` in the `Cache-Control` header if serving local assets.

### Middleware

    var connect = require('connect'),
        express = require('express'),
        cmbn = require('cmbn'),
        app = express.createServer();
    
    app.use(connect.compress());
    app.use(cmbn.server.middleware());
    app.listen(80);

##### Options

`middleware` takes an optional argument which is an object containing one or more of the following:

* `cacheSize` - The size in bytes to reserve for the [lru-cache](https://github.com/isaacs/node-lru-cache) which stores external assets which have been fetched. Default is `5000000` (~5MB).
* `cacheFunc` -The cache function used to determine the size of each asset, default is to return `item.length`.

### Node Client

    var cmbn = require('cmbn'),
        url = cmbn.client.combine([
            'http://cdnjs.cloudflare.com/ajax/libs/require.js/1.0.8/require.min.js',
            'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js''
        ]);
    
    // http://cmbn.us/~cj;require.js,1.0.8,require.min.js/~gg;jquery,1.7.2,jquery.min.js
    console.log(url);

##### Options

`combine` also takes an optional argument which is an object containing one or more of the following:

* `host` - The hostname[:port] which is running cmbn. Defaults to cmbn.us (see note under Usage). 
* `protocol` - The protocol for the host running cmbn. Defaults to `http`.

### Browser Client

    <script src="http://cmbn.us/libs/cmbn/0.0.1/cmbn.min.js"></script>
    <script>
    var url = cmbn.client.combine([
        'http://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js',
        'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js',
        'http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.10/jquery-ui.min.js'
    ]);
    
    // http://cmbn.us/~gg;swfobject,2.2,swfobject.js;jquery,1.7.2,jquery.min.js/~ms;jquery.ui,1.8.10,jquery-ui.min.js
    console.log(url);
    </script>

##### Options

See Node Client.

### Adding a CDN

    var cmbn = require('../index');
        
    // add cdn for localhost
    cmbn.cdns.addCdn('lh', {host: 'localhost:8080', prefix: 'libs/'});
    
    var url = cmbn.client.combine([
        'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js',
        'http://localhost:8080/libs/cmbn/0.0.1/cmbn.min.js'
    ], {host: 'localhost:8080'});
    
    // http://localhost:8080/~gg;jquery,1.7.2,jquery.min.js/~lh;cmbn,0.0.1,cmbn.min.js
    console.log(url);

### Run the Example

After installing the package run `node examples` from the package root.
A link will be output by the client and the server will start.
Copy the link and paste it into a browser to see the comboed output.

### More

See the examples folder and code for more usage information.

## License

MIT
