const crypto = require('crypto');
const { ADMIN_PASSCODE } = require('../config/env');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const failedAttemptsByIp = new Map();

function getClientKey(req) {
  return (req.socket && req.socket.remoteAddress) || 'local';
}

function checkRateLimit(clientKey) {
  const record = failedAttemptsByIp.get(clientKey);
  if (!record) return { locked: false, retryAfterSec: 0 };

  const elapsed = Date.now() - record.firstFailedAt;
  if (elapsed > LOCKOUT_WINDOW_MS) {
    failedAttemptsByIp.delete(clientKey);
    return { locked: false, retryAfterSec: 0 };
  }

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSec = Math.ceil((LOCKOUT_WINDOW_MS - elapsed) / 1000);
    return { locked: true, retryAfterSec };
  }

  return { locked: false, retryAfterSec: 0 };
}

function recordAuthFailure(clientKey) {
  const now = Date.now();
  const record = failedAttemptsByIp.get(clientKey);
  if (!record || now - record.firstFailedAt > LOCKOUT_WINDOW_MS) {
    failedAttemptsByIp.set(clientKey, { count: 1, firstFailedAt: now });
  } else {
    record.count += 1;
  }
}

function clearAuthFailures(clientKey) {
  failedAttemptsByIp.delete(clientKey);
}

function isPasscodeValid(candidate) {
  if (typeof candidate !== 'string' || candidate.length === 0) return false;
  const expectedHash = crypto.createHash('sha256').update(String(ADMIN_PASSCODE)).digest();
  const candidateHash = crypto.createHash('sha256').update(candidate).digest();
  return crypto.timingSafeEqual(expectedHash, candidateHash);
}

function requireAdmin(req, res, next) {
  const clientKey = getClientKey(req);
  const limit = checkRateLimit(clientKey);
  if (limit.locked) {
    return res.status(429).json({
      success: false,
      data: null,
      error: `ระงับการเข้าถึงชั่วคราวเนื่องจากใส่รหัสผิดเกินกำหนด กรุณารอประมาณ ${Math.ceil(limit.retryAfterSec / 60)} นาที`
    });
  }

  const headerCode = req.headers['x-admin-passcode'];
  if (!isPasscodeValid(headerCode)) {
    if (headerCode) recordAuthFailure(clientKey);
    return res.status(401).json({
      success: false,
      data: null,
      error: 'กรุณาปลดล็อกสิทธิ์ผู้ดูแลระบบ (Admin) ก่อนดำเนินการ'
    });
  }

  clearAuthFailures(clientKey);
  return next();
}

function verifyAdminHandler(req, res) {
  const clientKey = getClientKey(req);
  const limit = checkRateLimit(clientKey);
  if (limit.locked) {
    return res.status(429).json({
      success: false,
      data: null,
      error: `ใส่รหัสผิดเกิน ${MAX_FAILED_ATTEMPTS} ครั้ง ระบบล็อกชั่วคราว กรุณารอประมาณ ${Math.ceil(limit.retryAfterSec / 60)} นาที`
    });
  }

  const passcode = req.body && typeof req.body.passcode === 'string' ? req.body.passcode.trim() : '';
  if (!isPasscodeValid(passcode)) {
    recordAuthFailure(clientKey);
    return res.status(401).json({
      success: false,
      data: null,
      error: 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง'
    });
  }

  clearAuthFailures(clientKey);
  return res.status(200).json({
    success: true,
    data: { verified: true },
    error: null
  });
}

module.exports = {
  isPasscodeValid,
  requireAdmin,
  verifyAdminHandler,
  clearAuthFailures
};
