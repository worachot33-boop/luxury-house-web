const { getDb } = require('../db/connection');

const VALID_STATUSES = ['available', 'reserved', 'sold'];

function sanitizeText(val, maxLen = 500) {
  if (val === undefined || val === null) return '';
  return String(val).trim().slice(0, maxLen);
}

function buildSlug(title, plotCode) {
  const base = `${String(title || 'residence')}-${String(plotCode || '')}`
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `unit-${Date.now()}`;
}

function attachRelations(db, properties) {
  if (!properties || properties.length === 0) return [];

  const ids = properties.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(', ');

  const features = db
    .prepare(
      `SELECT id, property_id, room_name, feature_detail, material_spec, sort_order
       FROM builtin_features
       WHERE property_id IN (${placeholders})
       ORDER BY sort_order ASC, id ASC`
    )
    .all(...ids);

  const plans = db
    .prepare(
      `SELECT id, property_id, floor_number, floor_label, area_sqm, room_summary, plan_image
       FROM floor_plans
       WHERE property_id IN (${placeholders})
       ORDER BY floor_number ASC, id ASC`
    )
    .all(...ids);

  const featureMap = new Map();
  const planMap = new Map();

  for (const f of features) {
    if (!featureMap.has(f.property_id)) featureMap.set(f.property_id, []);
    featureMap.get(f.property_id).push(f);
  }

  for (const pl of plans) {
    if (!planMap.has(pl.property_id)) planMap.set(pl.property_id, []);
    planMap.get(pl.property_id).push(pl);
  }

  return properties.map((prop) => ({
    ...prop,
    is_featured: Boolean(prop.is_featured),
    builtin_features: featureMap.get(prop.id) || [],
    floor_plans: planMap.get(prop.id) || []
  }));
}

function listProperties(req, res) {
  try {
    const db = getDb();
    const { minPrice, maxPrice, status, bedrooms, minBedrooms, search, sort } = req.query || {};

    const conditions = [];
    const params = [];

    let parsedMinPrice = null;
    let parsedMaxPrice = null;

    if (minPrice !== undefined && minPrice !== '') {
      const minVal = Number(minPrice);
      if (!Number.isFinite(minVal) || minVal < 0) {
        return res.status(400).json({ success: false, data: null, error: 'ราคาขั้นต่ำ (minPrice) ไม่ถูกต้อง' });
      }
      parsedMinPrice = minVal;
      conditions.push('price_thb >= ?');
      params.push(minVal);
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      const maxVal = Number(maxPrice);
      if (!Number.isFinite(maxVal) || maxVal < 0) {
        return res.status(400).json({ success: false, data: null, error: 'ราคาสูงสุด (maxPrice) ไม่ถูกต้อง' });
      }
      parsedMaxPrice = maxVal;
      conditions.push('price_thb <= ?');
      params.push(maxVal);
    }

    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'ราคาขั้นต่ำต้องไม่มากกว่าราคาสูงสุด กรุณาเลือกช่วงงบประมาณใหม่'
      });
    }

    if (status && status !== 'all') {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, data: null, error: 'สถานะแปลงบ้านไม่ถูกต้อง' });
      }
      conditions.push('status = ?');
      params.push(status);
    }

    if (bedrooms !== undefined && bedrooms !== '' && bedrooms !== 'all') {
      const bedVal = Number(bedrooms);
      if (!Number.isInteger(bedVal) || bedVal <= 0) {
        return res.status(400).json({ success: false, data: null, error: 'จำนวนห้องนอนไม่ถูกต้อง' });
      }
      conditions.push('bedrooms = ?');
      params.push(bedVal);
    } else if (minBedrooms !== undefined && minBedrooms !== '') {
      const minBedVal = Number(minBedrooms);
      if (!Number.isInteger(minBedVal) || minBedVal <= 0) {
        return res.status(400).json({ success: false, data: null, error: 'จำนวนห้องนอนขั้นต่ำไม่ถูกต้อง' });
      }
      conditions.push('bedrooms >= ?');
      params.push(minBedVal);
    }

    if (search && String(search).trim() !== '') {
      const keyword = `%${String(search).trim()}%`;
      conditions.push(
        '(plot_code LIKE ? OR title LIKE ? OR subtitle LIKE ? OR builtin_style LIKE ? OR description LIKE ?)'
      );
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY price_thb ASC, id ASC';
    if (sort === 'price_desc') orderClause = 'ORDER BY price_thb DESC, id ASC';
    else if (sort === 'area_desc') orderClause = 'ORDER BY usable_area_sqm DESC, price_thb ASC';
    else if (sort === 'newest') orderClause = 'ORDER BY created_at DESC, id DESC';

    const rows = db
      .prepare(`SELECT * FROM properties ${whereClause} ${orderClause}`)
      .all(...params);

    const enriched = attachRelations(db, rows);
    return res.status(200).json({ success: true, data: enriched, error: null });
  } catch (err) {
    console.error('[property_controller.listProperties]', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'เกิดข้อผิดพลาดในการดึงรายการบ้านจากฐานข้อมูล'
    });
  }
}

function getPropertyById(req, res) {
  try {
    const db = getDb();
    const rawParam = sanitizeText(req.params && req.params.id, 120);
    if (!rawParam) {
      return res.status(400).json({ success: false, data: null, error: 'กรุณาระบุรหัสบ้านที่ต้องการดูรายละเอียด' });
    }

    let row = null;
    if (/^\d+$/.test(rawParam)) {
      row = db.prepare('SELECT * FROM properties WHERE id = ?').get(Number(rawParam));
    } else {
      row = db
        .prepare('SELECT * FROM properties WHERE slug = ? OR UPPER(plot_code) = UPPER(?)')
        .get(rawParam, rawParam);
    }

    if (!row) {
      return res.status(404).json({ success: false, data: null, error: 'ไม่พบข้อมูลแปลงบ้านที่ระบุ' });
    }

    const [detailed] = attachRelations(db, [row]);
    return res.status(200).json({ success: true, data: detailed, error: null });
  } catch (err) {
    console.error('[property_controller.getPropertyById]', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'เกิดข้อผิดพลาดในการดึงรายละเอียดบ้าน'
    });
  }
}

function createProperty(req, res) {
  const db = getDb();
  let inTransaction = false;

  try {
    const body = req.body || {};
    const plot_code = sanitizeText(body.plot_code, 30).toUpperCase();
    const title = sanitizeText(body.title, 150);
    const subtitle = sanitizeText(body.subtitle, 300) || 'บ้านเดี่ยวตกแต่งบิ้วอินครบพร้อมเข้าอยู่';
    const price_thb = Number(body.price_thb);
    const usable_area_sqm = Number(body.usable_area_sqm);
    const land_sqw = Number(body.land_sqw);
    const bedrooms = Number(body.bedrooms);
    const bathrooms = Number(body.bathrooms);
    const parking = Number(body.parking ?? 2);
    const maid_rooms = Number(body.maid_rooms ?? 0);
    const status = body.status || 'available';
    const highlight_badge = sanitizeText(body.highlight_badge, 120);
    const builtin_style = sanitizeText(body.builtin_style, 120) || 'Warm Champagne Luxury';
    const builtin_value_thb = Number(body.builtin_value_thb ?? 0);
    const description = sanitizeText(body.description, 2000) || subtitle;
    const hero_image = sanitizeText(body.hero_image, 260) || 'assets/images/villa_serene_hero.jpg';
    const before_image = sanitizeText(body.before_image, 260) || 'assets/images/builtin_before_shell.jpg';
    const after_image = sanitizeText(body.after_image, 260) || 'assets/images/builtin_after_luxury.jpg';
    const is_featured = body.is_featured ? 1 : 0;
    const slug = sanitizeText(body.slug, 160) || buildSlug(title, plot_code);

    if (!plot_code || !title) {
      return res.status(400).json({ success: false, data: null, error: 'กรุณาระบุรหัสแปลงบ้าน (plot_code) และชื่อแบบบ้าน (title)' });
    }
    if (!Number.isFinite(price_thb) || price_thb < 1000000) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'กรุณาระบุราคาขายเป็นหน่วยบาทเต็ม (ขั้นต่ำ 1,000,000 บาท เช่น 12900000)'
      });
    }
    if (!Number.isInteger(usable_area_sqm) || usable_area_sqm <= 0 || !Number.isFinite(land_sqw) || land_sqw <= 0) {
      return res.status(400).json({ success: false, data: null, error: 'พื้นที่ใช้สอยและขนาดที่ดินต้องมากกว่า 0' });
    }
    if (!Number.isInteger(bedrooms) || bedrooms <= 0 || !Number.isInteger(bathrooms) || bathrooms <= 0) {
      return res.status(400).json({ success: false, data: null, error: 'จำนวนห้องนอนและห้องน้ำต้องเป็นจำนวนเต็มที่มากกว่า 0' });
    }
    if (!Number.isInteger(parking) || parking < 0 || !Number.isInteger(maid_rooms) || maid_rooms < 0) {
      return res.status(400).json({ success: false, data: null, error: 'จำนวนที่จอดรถและห้องแม่บ้านต้องไม่ติดลบ' });
    }
    if (!Number.isFinite(builtin_value_thb) || builtin_value_thb < 0 || builtin_value_thb >= price_thb) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'มูลค่างานบิ้วอินต้องไม่ติดลบและต้องน้อยกว่าราคาขายบ้าน'
      });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, data: null, error: 'สถานะแปลงบ้านต้องเป็น available, reserved หรือ sold เท่านั้น' });
    }

    db.exec('BEGIN TRANSACTION;');
    inTransaction = true;

    const result = db
      .prepare(
        `INSERT INTO properties (
          plot_code, title, slug, subtitle, price_thb,
          usable_area_sqm, land_sqw, bedrooms, bathrooms, parking,
          maid_rooms, status, highlight_badge, builtin_style, builtin_value_thb,
          description, hero_image, before_image, after_image, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        plot_code,
        title,
        slug,
        subtitle,
        Math.round(price_thb),
        usable_area_sqm,
        land_sqw,
        bedrooms,
        bathrooms,
        parking,
        maid_rooms,
        status,
        highlight_badge,
        builtin_style,
        Math.round(builtin_value_thb),
        description,
        hero_image,
        before_image,
        after_image,
        is_featured
      );

    const propertyId = Number(result.lastInsertRowid);

    if (Array.isArray(body.builtin_features)) {
      const featStmt = db.prepare(
        `INSERT INTO builtin_features (property_id, room_name, feature_detail, material_spec, sort_order)
         VALUES (?, ?, ?, ?, ?)`
      );
      body.builtin_features.forEach((feat, idx) => {
        const roomName = sanitizeText(feat.room_name, 120);
        const detail = sanitizeText(feat.feature_detail, 500);
        const spec = sanitizeText(feat.material_spec, 300);
        if (roomName && detail) {
          featStmt.run(propertyId, roomName, detail, spec || '-', Number(feat.sort_order) || idx + 1);
        }
      });
    }

    if (Array.isArray(body.floor_plans)) {
      const planStmt = db.prepare(
        `INSERT INTO floor_plans (property_id, floor_number, floor_label, area_sqm, room_summary, plan_image)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      body.floor_plans.forEach((pl, idx) => {
        const floorNo = Number(pl.floor_number) || idx + 1;
        const label = sanitizeText(pl.floor_label, 100) || `ชั้น ${floorNo}`;
        const area = Number(pl.area_sqm) || Math.round(usable_area_sqm / 2);
        const summary = sanitizeText(pl.room_summary, 500) || '-';
        const image = sanitizeText(pl.plan_image, 260) || 'assets/images/plan_f1_standard.svg';
        if (area > 0) {
          planStmt.run(propertyId, floorNo, label, area, summary, image);
        }
      });
    }

    db.exec('COMMIT;');
    inTransaction = false;

    const createdRow = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    const [detailed] = attachRelations(db, [createdRow]);
    return res.status(201).json({ success: true, data: detailed, error: null });
  } catch (err) {
    if (inTransaction) {
      try { db.exec('ROLLBACK;'); } catch (_) {}
    }
    const errMsg = String(err.message || '');
    if (errMsg.includes('UNIQUE constraint failed: floor_plans')) {
      return res.status(409).json({
        success: false,
        data: null,
        error: 'เลขชั้นของแปลนบ้าน (floor_number) ซ้ำกันในบ้านหลังเดียวกัน'
      });
    }
    if (errMsg.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        data: null,
        error: 'รหัสแปลงบ้าน (plot_code) หรือลิงก์ (slug) ซ้ำกับที่มีอยู่ในระบบแล้ว'
      });
    }
    console.error('[property_controller.createProperty]', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'เกิดข้อผิดพลาดในการสร้างข้อมูลแปลงบ้านใหม่'
    });
  }
}

function updateProperty(req, res) {
  const db = getDb();
  let inTransaction = false;

  try {
    const id = Number(req.params && req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, data: null, error: 'รหัสอ้างอิงบ้าน (id) ไม่ถูกต้อง' });
    }

    const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, data: null, error: 'ไม่พบแปลงบ้านที่ต้องการแก้ไข' });
    }

    const body = req.body || {};
    const plot_code = body.plot_code !== undefined ? sanitizeText(body.plot_code, 30).toUpperCase() : existing.plot_code;
    const title = body.title !== undefined ? sanitizeText(body.title, 150) : existing.title;
    const slug = body.slug !== undefined ? (sanitizeText(body.slug, 160) || buildSlug(title, plot_code)) : existing.slug;
    const subtitle = body.subtitle !== undefined ? sanitizeText(body.subtitle, 300) : existing.subtitle;
    const price_thb = body.price_thb !== undefined ? Number(body.price_thb) : existing.price_thb;
    const usable_area_sqm = body.usable_area_sqm !== undefined ? Number(body.usable_area_sqm) : existing.usable_area_sqm;
    const land_sqw = body.land_sqw !== undefined ? Number(body.land_sqw) : existing.land_sqw;
    const bedrooms = body.bedrooms !== undefined ? Number(body.bedrooms) : existing.bedrooms;
    const bathrooms = body.bathrooms !== undefined ? Number(body.bathrooms) : existing.bathrooms;
    const parking = body.parking !== undefined ? Number(body.parking) : existing.parking;
    const maid_rooms = body.maid_rooms !== undefined ? Number(body.maid_rooms) : existing.maid_rooms;
    const status = body.status !== undefined ? body.status : existing.status;
    const highlight_badge = body.highlight_badge !== undefined ? sanitizeText(body.highlight_badge, 120) : existing.highlight_badge;
    const builtin_style = body.builtin_style !== undefined ? sanitizeText(body.builtin_style, 120) : existing.builtin_style;
    const builtin_value_thb = body.builtin_value_thb !== undefined ? Number(body.builtin_value_thb) : existing.builtin_value_thb;
    const description = body.description !== undefined ? sanitizeText(body.description, 2000) : existing.description;
    const hero_image = body.hero_image !== undefined ? sanitizeText(body.hero_image, 260) : existing.hero_image;
    const before_image = body.before_image !== undefined ? sanitizeText(body.before_image, 260) : existing.before_image;
    const after_image = body.after_image !== undefined ? sanitizeText(body.after_image, 260) : existing.after_image;
    const is_featured = body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : existing.is_featured;

    if (!plot_code || !title) {
      return res.status(400).json({ success: false, data: null, error: 'รหัสแปลงบ้านและชื่อแบบบ้านห้ามเป็นค่าว่าง' });
    }
    if (!Number.isFinite(price_thb) || price_thb < 1000000) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'กรุณาระบุราคาขายเป็นหน่วยบาทเต็ม (ขั้นต่ำ 1,000,000 บาท เช่น 12900000)'
      });
    }
    if (!Number.isInteger(usable_area_sqm) || usable_area_sqm <= 0 || !Number.isFinite(land_sqw) || land_sqw <= 0) {
      return res.status(400).json({ success: false, data: null, error: 'พื้นที่ใช้สอยและขนาดที่ดินต้องมากกว่า 0' });
    }
    if (!Number.isInteger(bedrooms) || bedrooms <= 0 || !Number.isInteger(bathrooms) || bathrooms <= 0) {
      return res.status(400).json({ success: false, data: null, error: 'จำนวนห้องนอนและห้องน้ำต้องเป็นจำนวนเต็มมากกว่า 0' });
    }
    if (!Number.isInteger(parking) || parking < 0 || !Number.isInteger(maid_rooms) || maid_rooms < 0) {
      return res.status(400).json({ success: false, data: null, error: 'จำนวนที่จอดรถและห้องแม่บ้านต้องไม่ติดลบ' });
    }
    if (!Number.isFinite(builtin_value_thb) || builtin_value_thb < 0 || builtin_value_thb >= price_thb) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'มูลค่างานบิ้วอินต้องไม่ติดลบและต้องน้อยกว่าราคาขายบ้าน'
      });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, data: null, error: 'สถานะแปลงบ้านต้องเป็น available, reserved หรือ sold เท่านั้น' });
    }

    db.exec('BEGIN TRANSACTION;');
    inTransaction = true;

    db.prepare(
      `UPDATE properties
       SET plot_code = ?, title = ?, slug = ?, subtitle = ?, price_thb = ?,
           usable_area_sqm = ?, land_sqw = ?, bedrooms = ?, bathrooms = ?,
           parking = ?, maid_rooms = ?, status = ?, highlight_badge = ?,
           builtin_style = ?, builtin_value_thb = ?, description = ?,
           hero_image = ?, before_image = ?, after_image = ?, is_featured = ?,
           updated_at = datetime('now', 'localtime')
       WHERE id = ?`
    ).run(
      plot_code,
      title,
      slug,
      subtitle,
      Math.round(price_thb),
      usable_area_sqm,
      land_sqw,
      bedrooms,
      bathrooms,
      parking,
      maid_rooms,
      status,
      highlight_badge,
      builtin_style,
      Math.round(builtin_value_thb),
      description,
      hero_image,
      before_image,
      after_image,
      is_featured,
      id
    );

    // Keep historical plot code synced if plot_code changed
    if (plot_code !== existing.plot_code) {
      db.prepare('UPDATE viewing_leads SET interested_plot = ? WHERE property_id = ?').run(plot_code, id);
    }

    if (Array.isArray(body.builtin_features)) {
      db.prepare('DELETE FROM builtin_features WHERE property_id = ?').run(id);
      const featStmt = db.prepare(
        `INSERT INTO builtin_features (property_id, room_name, feature_detail, material_spec, sort_order)
         VALUES (?, ?, ?, ?, ?)`
      );
      body.builtin_features.forEach((feat, idx) => {
        const roomName = sanitizeText(feat.room_name, 120);
        const detail = sanitizeText(feat.feature_detail, 500);
        const spec = sanitizeText(feat.material_spec, 300);
        if (roomName && detail) {
          featStmt.run(id, roomName, detail, spec || '-', Number(feat.sort_order) || idx + 1);
        }
      });
    }

    if (Array.isArray(body.floor_plans)) {
      db.prepare('DELETE FROM floor_plans WHERE property_id = ?').run(id);
      const planStmt = db.prepare(
        `INSERT INTO floor_plans (property_id, floor_number, floor_label, area_sqm, room_summary, plan_image)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      body.floor_plans.forEach((pl, idx) => {
        const floorNo = Number(pl.floor_number) || idx + 1;
        const label = sanitizeText(pl.floor_label, 100) || `ชั้น ${floorNo}`;
        const area = Number(pl.area_sqm) || Math.round(usable_area_sqm / 2);
        const summary = sanitizeText(pl.room_summary, 500) || '-';
        const image = sanitizeText(pl.plan_image, 260) || 'assets/images/plan_f1_standard.svg';
        if (area > 0) {
          planStmt.run(id, floorNo, label, area, summary, image);
        }
      });
    }

    db.exec('COMMIT;');
    inTransaction = false;

    const updatedRow = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    const [detailed] = attachRelations(db, [updatedRow]);
    return res.status(200).json({ success: true, data: detailed, error: null });
  } catch (err) {
    if (inTransaction) {
      try { db.exec('ROLLBACK;'); } catch (_) {}
    }
    const errMsg = String(err.message || '');
    if (errMsg.includes('UNIQUE constraint failed: floor_plans')) {
      return res.status(409).json({
        success: false,
        data: null,
        error: 'เลขชั้นของแปลนบ้าน (floor_number) ซ้ำกันในบ้านหลังเดียวกัน'
      });
    }
    if (errMsg.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        data: null,
        error: 'รหัสแปลงบ้านหรือลิงก์นี้ซ้ำกับแปลงอื่นในระบบ'
      });
    }
    console.error('[property_controller.updateProperty]', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลบ้าน'
    });
  }
}

function deleteProperty(req, res) {
  const db = getDb();
  let inTransaction = false;

  try {
    const id = Number(req.params && req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, data: null, error: 'รหัสอ้างอิงบ้าน (id) ไม่ถูกต้อง' });
    }

    const existing = db.prepare('SELECT id, plot_code, title FROM properties WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, data: null, error: 'ไม่พบแปลงบ้านที่ต้องการลบ' });
    }

    db.exec('BEGIN TRANSACTION;');
    inTransaction = true;

    // Preserve plot code on associated leads before ON DELETE SET NULL clears property_id
    db.prepare(
      "UPDATE viewing_leads SET interested_plot = ? WHERE property_id = ? AND (interested_plot IS NULL OR interested_plot = '')"
    ).run(existing.plot_code, id);

    db.prepare('DELETE FROM properties WHERE id = ?').run(id);

    db.exec('COMMIT;');
    inTransaction = false;

    return res.status(200).json({
      success: true,
      data: { deletedId: id, plot_code: existing.plot_code, title: existing.title },
      error: null
    });
  } catch (err) {
    if (inTransaction) {
      try { db.exec('ROLLBACK;'); } catch (_) {}
    }
    console.error('[property_controller.deleteProperty]', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'เกิดข้อผิดพลาดในการลบข้อมูลแปลงบ้าน'
    });
  }
}

module.exports = {
  listProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty
};
