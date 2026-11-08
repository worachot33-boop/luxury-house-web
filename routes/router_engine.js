const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function compilePattern(pattern) {
  const clean = normalizePath(pattern);
  if (clean === '/') {
    return { regex: /^\/$/, keys: [] };
  }
  const keys = [];
  const escaped = clean
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return {
    regex: new RegExp(`^${escaped}$`),
    keys
  };
}

function createRouter() {
  const routes = [];

  function register(method, subPath, ...handlers) {
    routes.push({
      method: method.toUpperCase(),
      subPath: normalizePath(subPath),
      handlers
    });
  }

  return {
    routes,
    get: (subPath, ...handlers) => register('GET', subPath, ...handlers),
    post: (subPath, ...handlers) => register('POST', subPath, ...handlers),
    put: (subPath, ...handlers) => register('PUT', subPath, ...handlers),
    delete: (subPath, ...handlers) => register('DELETE', subPath, ...handlers)
  };
}

function enhanceResponse(res) {
  res.statusCode = 200;

  res.status = function setStatus(code) {
    res.statusCode = code;
    return res;
  };

  res.json = function sendJson(payload) {
    if (res.writableEnded) return res;
    const bodyStr = JSON.stringify(payload);
    res.writeHead(res.statusCode || 200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(bodyStr);
    return res;
  };

  return res;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const method = (req.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      resolve({});
      return;
    }

    let totalBytes = 0;
    const chunks = [];
    let aborted = false;

    req.on('data', (chunk) => {
      if (aborted) return;
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        aborted = true;
        const err = new Error('PAYLOAD_TOO_LARGE');
        err.statusCode = 413;
        reject(err);
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (aborted) return;
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed && typeof parsed === 'object' ? parsed : {});
      } catch (_) {
        const err = new Error('INVALID_JSON');
        err.statusCode = 400;
        reject(err);
      }
    });

    req.on('error', (err) => {
      if (!aborted) reject(err);
    });
  });
}

function createApiDispatcher() {
  const compiledRoutes = [];

  function mount(basePath, routerOrMethod, maybePath, ...maybeHandlers) {
    if (routerOrMethod && Array.isArray(routerOrMethod.routes)) {
      const prefix = normalizePath(basePath);
      for (const r of routerOrMethod.routes) {
        const fullPattern =
          r.subPath === '/' ? prefix : `${prefix === '/' ? '' : prefix}${r.subPath}`;
        const { regex, keys } = compilePattern(fullPattern);
        compiledRoutes.push({
          method: r.method,
          regex,
          keys,
          handlers: r.handlers
        });
      }
    } else if (typeof routerOrMethod === 'string') {
      const method = routerOrMethod.toUpperCase();
      const { regex, keys } = compilePattern(basePath);
      const handlers = typeof maybePath === 'function' ? [maybePath, ...maybeHandlers] : maybeHandlers;
      compiledRoutes.push({ method, regex, keys, handlers });
    }
  }

  async function dispatch(req, res) {
    enhanceResponse(res);

    let parsedUrl;
    try {
      parsedUrl = new URL(req.url || '/', 'http://localhost');
    } catch (_) {
      return res.status(400).json({ success: false, data: null, error: 'URL ไม่ถูกต้อง' });
    }

    const pathname = normalizePath(parsedUrl.pathname);
    const method = (req.method || 'GET').toUpperCase();

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Passcode'
      });
      res.end();
      return true;
    }

    let matchedRoute = null;
    let extractedParams = {};
    let pathMatchedWithOtherMethod = false;

    for (const route of compiledRoutes) {
      const match = pathname.match(route.regex);
      if (match) {
        if (route.method === method) {
          matchedRoute = route;
          const paramsObj = {};
          try {
            route.keys.forEach((key, idx) => {
              paramsObj[key] = decodeURIComponent(match[idx + 1]);
            });
          } catch (_) {
            res.status(400).json({ success: false, data: null, error: 'พารามิเตอร์ใน URL ไม่ถูกต้อง' });
            return true;
          }
          extractedParams = paramsObj;
          break;
        } else {
          pathMatchedWithOtherMethod = true;
        }
      }
    }

    if (!matchedRoute) {
      if (pathMatchedWithOtherMethod) {
        res.status(405).json({ success: false, data: null, error: `ไม่รองรับคำสั่ง ${method} ในเส้นทางนี้` });
        return true;
      }
      if (pathname === '/api' || pathname.startsWith('/api/')) {
        res.status(404).json({ success: false, data: null, error: 'ไม่พบเส้นทาง API ที่ร้องขอ' });
        return true;
      }
      return false;
    }

    const queryObj = {};
    for (const [k, v] of parsedUrl.searchParams.entries()) {
      queryObj[k] = v;
    }
    req.query = queryObj;
    req.params = extractedParams;

    try {
      req.body = await parseJsonBody(req);
    } catch (err) {
      if (err.statusCode === 413) {
        res.writeHead(413, {
          'Content-Type': 'application/json; charset=utf-8',
          'Connection': 'close',
          'X-Content-Type-Options': 'nosniff'
        });
        res.end(
          JSON.stringify({
            success: false,
            data: null,
            error: 'ข้อมูลที่ส่งมามีขนาดใหญ่เกินกำหนด (สูงสุด 1MB)'
          })
        );
        if (typeof req.destroy === 'function') req.destroy();
        return true;
      }
      res.status(400).json({
        success: false,
        data: null,
        error: 'รูปแบบข้อมูล JSON ที่ส่งมาไม่ถูกต้อง'
      });
      return true;
    }

    let idx = 0;
    const runNext = async () => {
      if (idx >= matchedRoute.handlers.length || res.writableEnded) return;
      const fn = matchedRoute.handlers[idx++];
      await fn(req, res, runNext);
    };

    try {
      await runNext();
    } catch (err) {
      console.error('[router_engine.dispatch] Unhandled error:', err);
      if (!res.writableEnded) {
        res.status(500).json({
          success: false,
          data: null,
          error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
        });
      }
    }

    return true;
  }

  return {
    use: (prefix, router) => mount(prefix, router),
    get: (routePath, ...handlers) => mount(routePath, 'GET', ...handlers),
    post: (routePath, ...handlers) => mount(routePath, 'POST', ...handlers),
    put: (routePath, ...handlers) => mount(routePath, 'PUT', ...handlers),
    delete: (routePath, ...handlers) => mount(routePath, 'DELETE', ...handlers),
    dispatch
  };
}

module.exports = {
  createRouter,
  createApiDispatcher
};

