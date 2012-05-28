var cmbn = require('../index');

// start the server and point to the dir we want to serve assets from locally (optional)
cmbn.server.createServer({port: 8080, staticDir: __dirname + '/public'});
