var fs = require('fs'),
    strip = require('stripper').strip,
    uglify = require('uglify-js'),
    root = __dirname + '/../',
    cdns = root + 'lib/cdns.js',
    client = root + 'lib/combine.js',
    pkg = JSON.parse(fs.readFileSync(root + 'package.json', 'utf-8')),
    c = fs.readFileSync(root + 'build/copyright.js', 'utf-8'),
    ver = pkg.version,
    outfile = root + 'examples/public/libs/cmbn/' + ver + '/cmbn.min.js',
    out = strip(cdns) + '\n' + strip(client);

function write(outfile, out)
{
    var file = outfile.replace(new RegExp('[^/]+/../'), ''),
        dir = file.substr(0, file.lastIndexOf('/')),
        outmin = uglify(out);
    
    // make the dirs
    try
    {
        fs.mkdirSync(dir);
        console.log('Created dir ' + dir);
    }
    catch (e)
    {
        console.log(e.message);
    }
    
    // write minified
    console.log('Writing ' + file + '...');
    fs.writeFileSync(file, c + outmin, 'utf-8');
    
    // write unminified
    file = file.replace('.min', '');
    console.log('Writing ' + file + '...');
    fs.writeFileSync(file, out, 'utf-8');
}

write(outfile, out);
// write('latest');

console.log('Done.');
