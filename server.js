const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { PORT, ROOT_DIR, DATA_EXCEL_DIR, PROJECT_BRAND } = require('./config/env');
const { initSchema, closeDb } = require('./db/connection');
const { createApiDispatcher } = require('./routes/router_engine');
const { verifyAdminHandler } = require('./routes/admin_auth');
const propertyRoutes = require('./routes/property_routes');
const leadRoutes = require('./routes/lead_routes');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel'
};

function getLatestExcelFile() {
  if (!fs.existsSync(DATA_EXCEL_DIR)) return null;

  const candidates = [];
  const files = fs.readdirSync(DATA_EXCEL_DIR);

  for (const f of files) {
    const lower = f.toLowerCase();
    if ((lower.endsWith('.xlsx') || lower.endsWith('.xls')) && !f.startsWith('~$')) {
      const fullPath = path.join(DATA_EXCEL_DIR, f);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;

      let score = 0;
      const match = f.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
      if (match) {
        score = parseInt(`${match[1]}${match[2]}${match[3]}`, 10);
      }

      candidates.push({
        name: f,
        path: `data_excel/${f}`,
        score,
        mtime: stat.mtimeMs,
        mtimeFormatted: stat.mtime.toLocaleString('th-TH')
      });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.mtime - a.mtime;
  });

  return candidates[0];
}

function buildApp() {
  initSchema();

  const api = createApiDispatcher();

  api.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        port: PORT,
        timestamp: new Date().toISOString()
      },
      error: null
    });
  });

  api.get('/api/brand', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        name: PROJECT_BRAND.name,
        thaiSubtitle: PROJECT_BRAND.thaiSubtitle,
        priceRangeText: PROJECT_BRAND.priceRangeText,
        phone: PROJECT_BRAND.phone,
        lineId: PROJECT_BRAND.lineId,
        locationName: PROJECT_BRAND.locationName
      },
      error: null
    });
  });

  api.post('/api/admin/verify', verifyAdminHandler);

  api.get('/api/latest-excel', (req, res) => {
    try {
      const latest = getLatestExcelFile();
      res.status(200).json({ success: true, data: latest, error: null });
    } catch (err) {
      console.error('[server /api/latest-excel]', err);
      res.status(500).json({
        success: false,
        data: null,
        error: 'ไม่สามารถสแกนหาไฟล์ Excel ล่าสุดได้'
      });
    }
  });

  api.use('/api/properties', propertyRoutes);
  api.use('/api/leads', leadRoutes);

  const assetsRoot = path.resolve(ROOT_DIR, 'assets');
  const excelRoot = path.resolve(DATA_EXCEL_DIR);
  const indexHtmlPath = path.resolve(ROOT_DIR, 'index.html');

  function serveSafeStatic(req, res) {
    const method = (req.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return;
    }

    let pathname = '/';
    try {
      pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    } catch (_) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad Request');
      return;
    }

    if (pathname === '/favicon.ico') {
      const favSvg = path.join(assetsRoot, 'images', 'favicon.svg');
      if (fs.existsSync(favSvg)) {
        res.writeHead(200, {
          'Content-Type': 'image/svg+xml',
          'X-Content-Type-Options': 'nosniff'
        });
        if (method === 'HEAD') return res.end();
        return fs.createReadStream(favSvg).pipe(res);
      }
      res.writeHead(204);
      res.end();
      return;
    }

    let targetFile = null;

    if (pathname === '/' || pathname === '/index.html') {
      if (!fs.existsSync(indexHtmlPath)) {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        });
        res.end(
          `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>${PROJECT_BRAND.name}</title></head>` +
            `<body style="font-family:sans-serif;background:#FAF7F2;color:#241F1C;padding:3rem;text-align:center;">` +
            `<h1>${PROJECT_BRAND.name} — Backend API Ready (Port ${PORT})</h1>` +
            `<p>REST API เชื่อมต่อฐานข้อมูล SQLite สำเร็จแล้ว พร้อมสำหรับสร้างหน้าเว็บไซต์หลักใน Step 3</p>` +
            `<p><a href="/api/properties" style="color:#9E7B42;">ดูข้อมูล JSON จาก /api/properties</a></p>` +
            `</body></html>`
        );
        return;
      }
      targetFile = indexHtmlPath;
    } else if (pathname.startsWith('/assets/')) {
      const candidate = path.resolve(ROOT_DIR, `.${pathname}`);
      if (candidate.startsWith(assetsRoot + path.sep)) {
        targetFile = candidate;
      }
    } else if (pathname.startsWith('/data_excel/')) {
      const candidate = path.resolve(ROOT_DIR, `.${pathname}`);
      const baseName = path.basename(candidate);
      const lowerExt = path.extname(candidate).toLowerCase();
      if (
        candidate.startsWith(excelRoot + path.sep) &&
        !baseName.startsWith('~$') &&
        (lowerExt === '.xlsx' || lowerExt === '.xls')
      ) {
        targetFile = candidate;
      }
    }

    if (!targetFile || !fs.existsSync(targetFile)) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end('404 Not Found');
      return;
    }

    const stat = fs.statSync(targetFile);
    if (!stat.isFile()) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });

    if (method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(targetFile);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end();
    });
    stream.pipe(res);
  }

  const server = http.createServer(async (req, res) => {
    try {
      const handledByApi = await api.dispatch(req, res);
      if (!handledByApi) {
        serveSafeStatic(req, res);
      }
    } catch (err) {
      console.error('[server] Unhandled request error:', err);
      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        });
        res.end(JSON.stringify({ success: false, data: null, error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }));
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  });

  return server;
}

function startServer(port = PORT) {
  const server = buildApp();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      console.error(`[SERVER] Warning: Port ${port} is restricted or in use (${err.code}).`);
    } else {
      console.error('[SERVER] Server error:', err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    let wifiIp = '127.0.0.1';
    try {
      const ifaces = os.networkInterfaces();
      for (const name of Object.keys(ifaces)) {
        for (const net of ifaces[name] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            wifiIp = net.address;
            break;
          }
        }
        if (wifiIp !== '127.0.0.1') break;
      }
    } catch (_) {}

    console.log('==========================================================');
    console.log(`  ${PROJECT_BRAND.name} - Full-Stack Server`);
    console.log(`  Local PC URL : http://localhost:${port}/`);
    console.log(`  Mobile Wi-Fi : http://${wifiIp}:${port}/`);
    console.log(`  API Health   : http://localhost:${port}/api/health`);
    console.log(`  Properties   : http://localhost:${port}/api/properties`);
    console.log('==========================================================');
  });

  const shutdown = () => {
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = {
  buildApp,
  startServer,
  getLatestExcelFile
};

