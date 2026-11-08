const { getDb } = require('../db/connection');

const VALID_LEAD_STATUSES = ['new', 'contacted', 'visited', 'closed', 'cancelled'];

function sanitizeText(val, maxLen = 500) {
  if (val === undefined || val === null) return '';
  return String(val).trim().slice(0, maxLen);
}

function isValidThaiPhone(phoneStr) {
  const cleaned = String(phoneStr || '').replace(/[\s\-().]/g, '');
  return /^(?:\+66|66)0?[2-9]\d{7,8}$|^0[2-9]\d{7,8}$/.test(cleaned);
}

function isValidIsoDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function getBangkokTodayIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function createLead(req, res) {
  try {
    const db = getDb();
    const body = req.body || {};

    const full_name = sanitizeText(body.full_name, 120);
    const phone = sanitizeText(body.phone, 30);
    const line_id = sanitizeText(body.line_id, 80);
    const preferred_date = sanitizeText(body.preferred_date, 20);
    const preferred_time = sanitizeText(body.preferred_time, 50) || '10:00 - 12:00';
    const budget_range = sanitizeText(body.budget_range, 80) || '8 - 12 ล้านบาท';
    const note = sanitizeText(body.note, 1000);

    if (full_name.length < 2) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'กรุณาระบุชื่อ-นามสกุลผู้ติดต่ออย่างน้อย 2 ตัวอักษร'
      });
    }

    if (!isValidThaiPhone(phone)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง (เช่น 081-234-5678)'
      });
    }

    if (!isValidIsoDate(preferred_date)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'กรุณาเลือกวันที่ต้องการนัดชมโครงการให้ถูกต้อง (YYYY-MM-DD)'
      });
    }

    if (preferred_date < getBangkokTodayIso()) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'ไม่สามารถเลือกวันที่นัดชมย้อนหลังได้ กรุณาเลือกตั้งแต่วันนี้เป็นต้นไป'
      });
    }

    let resolvedPropertyId = null;
    let interested_plot = sanitizeText(body.interested_plot, 30).toUpperCase();

    if (body.property_id !== undefined && body.property_id !== null && body.property_id !== '') {
      const propIdNum = Number(body.property_id);
      if (Number.isInteger(propIdNum) && propIdNum > 0) {
        const propRow = db
          .prepare('SELECT id, plot_code FROM properties WHERE id = ?')
          .get(propIdNum);
        if (propRow) {
          resolvedPropertyId = propRow.id;
          interested_plot = propRow.plot_code;
        }
      }
    } else if (interested_plot) {
      const propRow = db
        .prepare('SELECT id, plot_code FROM properties WHERE UPPER(plot_code) = ?')
        .get(interested_plot);
      if (propRow) {
        resolvedPropertyId = propRow.id;
        interested_plot = propRow.plot_code;
      }
    }

    const result = db
      .prepare(
        `INSERT INTO viewing_leads (
          property_id, interested_plot, full_name, phone, line_id,
          preferred_date, preferred_time, budget_range, note, lead_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
      )
      .run(
        resolvedPropertyId,
        interested_plot,
        full_name,
        phone,
        line_id,
        preferred_date,
        preferred_time,
        budget_range,
        note
      );

    const newId = Number(result.lastInsertRowid);
    const createdLead = db
      .prepare(
        `SELECT l.*, p.title AS property_title, p.price_thb AS property_price_thb
         FROM viewing_leads l
         LEFT JOIN properties p ON p.id = l.property_id
         WHERE l.id = ?`
      )
      .get(newId);

    return res.status(201).json({ success: true, data: createdLead, error: null });
  } catch (err) {
    console.error('[lead_controller.createLead]', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลนัดชมโครงการ กรุณาลองใหม่อีกครั้ง'
    });
  }
}

function listLeads(req, res) {
  try {
    const db = getDb();
    const { status, search } = req.query || {};

    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      if (!VALID_LEAD_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, data: null, error: 'สถานะการติดตามลูกค้าไม่ถูกต้อง' });
      }
      conditions.push('l.lead_status = ?');
      params.push(status);
    }

    if (search && String(search).trim() !== '') {
      const keyword = `%${String(search).trim()}%`;
      conditions.push(
        '(l.full_name LIKE ? OR l.phone LIKE ? OR l.line_id LIKE ? OR l.interested_plot LIKE ? OR l.note LIKE ? OR p.title LIKE ?)'
      );
      params.push(keyword, keyword, keyword, keyword, keyword, keyword);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const leads = db
      .prepare(
        `SELECT
           l.*,
           COALESCE(p.plot_code, NULLIF(l.interested_plot, ''), '-') AS resolved_plot_code,
           p.title AS property_title,
           p.price_thb AS property_price_thb,
           p.status AS property_status
         FROM viewing_leads l
         LEFT JOIN properties p ON p.id = l.property_id
         ${whereClause}
         ORDER BY l.created_at DESC, l.id DESC`
      )
      .all(...params);

    const statusRows = db
      .prepare('SELECT lead_status, COUNT(*) AS cnt FROM viewing_leads GROUP BY lead_status')
      .all();

    const summary = { total: 0, new: 0, contacted: 0, visited: 0, closed: 0, cancelled: 0 };
    for (const r of statusRows) {
      if (summary[r.lead_status] !== undefined) {
        summary[r.lead_status] = r.cnt;
      }
      summary.total += r.cnt;
    }

    return res.status(200).json({
      success: true,
      data: { items: leads, filtered_count: leads.length, summary },
      error: null
    });
  } catch (err) {
    console.error('[lead_controller.listLeads]', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'เกิดข้อผิดพลาดในการดึงรายชื่อลูกค้านัดชมโครงการ'
    });
  }
}

function updateLeadStatus(req, res) {
  try {
    const db = getDb();
    const id = Number(req.params && req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, data: null, error: 'รหัสอ้างอิงลูกค้า (id) ไม่ถูกต้อง' });
    }

    const existing = db.prepare('SELECT * FROM viewing_leads WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, data: null, error: 'ไม่พบข้อมูลลูกค้ารายนี้ในระบบ' });
    }

    const body = req.body || {};
    const lead_status = body.lead_status !== undefined ? body.lead_status : existing.lead_status;
    const note = body.note !== undefined ? sanitizeText(body.note, 1000) : existing.note;

    if (!VALID_LEAD_STATUSES.includes(lead_status)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'สถานะลูกค้าต้องเป็น new, contacted, visited, closed หรือ cancelled เท่านั้น'
      });
    }

    db.prepare('UPDATE viewing_leads SET lead_status = ?, note = ? WHERE id = ?').run(
      lead_status,
      note,
      id
    );

    const updated = db
      .prepare(
        `SELECT
           l.*,
           COALESCE(p.plot_code, NULLIF(l.interested_plot, ''), '-') AS resolved_plot_code,
           p.title AS property_title,
           p.price_thb AS property_price_thb
         FROM viewing_leads l
         LEFT JOIN properties p ON p.id = l.property_id
         WHERE l.id = ?`
      )
      .get(id);

    return res.status(200).json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error('[lead_controller.updateLeadStatus]', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะลูกค้า'
    });
  }
}

module.exports = {
  createLead,
  listLeads,
  updateLeadStatus
};

