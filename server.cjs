#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
//  MI TURNO · Servidor local con rewrites como Vercel
//  Uso: node server.js
// ════════════════════════════════════════════════════════════════

var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = process.env.PORT || 8000;
var ROOT = __dirname;

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

function serveFile(res, filePath, status) {
  var ext = path.extname(filePath).toLowerCase();
  var ct = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(status || 200, {
      'Content-Type': ct,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

function tryServe(res, filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath, 200);
    return true;
  }
  return false;
}

var server = http.createServer(function (req, res) {
  var url = req.url.split('?')[0];
  var filePath;

  console.log(req.method + ' ' + url);

  // ── Rewrites como Vercel ──────────────────────────────
  if (url === '/') {
    // Raíz → landing page
    serveFile(res, path.join(ROOT, 'index.html'), 200);
    return;
  }

  if (url === '/app' || url === '/app/') {
    serveFile(res, path.join(ROOT, 'app.html'), 200);
    return;
  }

  // Cualquier otra ruta sin extensión → SPA (app.html)
  if (url.indexOf('.') === -1 && url !== '/') {
    serveFile(res, path.join(ROOT, 'app.html'), 200);
    return;
  }

  // Archivo estático directo
  filePath = path.join(ROOT, url);
  if (tryServe(res, filePath)) return;

  // Fallback: app.html para SPA
  serveFile(res, path.join(ROOT, 'app.html'), 200);
});

server.listen(PORT, '0.0.0.0', function () {
  var os = require('os');
  var ifaces = os.networkInterfaces();
  var ip = 'localhost';
  Object.keys(ifaces).forEach(function (name) {
    ifaces[name].forEach(function (iface) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ip = iface.address;
      }
    });
  });

  console.log('');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║     MI TURNO — Dev Server (Node)      ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log('║  PC:      http://localhost:' + PORT + '        ║');
  console.log('║  iPhone:  http://' + ip + ':' + PORT + '   ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log('║  App:     /app                         ║');
  console.log('║  Landing: /                            ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
});

console.log('Ctrl+C para detener');
