(function (window) {
  'use strict';

  var activeAdminTab = 'inventory';
  var editingPropertyId = null;
  var leadFilterStatus = 'all';
  var leadSearchQuery = '';
  var cachedLeadsData = { items: [], filtered_count: 0, summary: { total: 0, new: 0, contacted: 0, visited: 0, closed: 0, cancelled: 0 } };
  var adminToastMessage = '';
  var adminToastType = 'success';
  var lastFocusedTrigger = null;

  var LEAD_STATUS_LABELS = {
    new: 'ลูกค้าใหม่ (New)',
    contacted: 'ติดต่อแล้ว (Contacted)',
    visited: 'เข้าชมแล้ว (Visited)',
    closed: 'ปิดการขาย (Closed Won)',
    cancelled: 'ยกเลิกนัด (Cancelled)'
  };

  function esc(val) {
    return window.PropertyCatalog.escapeHtml(val);
  }

  function formatNum(n) {
    return Math.round(Number(n) || 0).toLocaleString('th-TH');
  }

  function updateHeaderAdminButton() {
    var btn = document.getElementById('openAdminCmsBtn');
    var mobileBtn = document.getElementById('mobileAdminCmsBtn');
    var isUnlocked = window.ApiClient && typeof window.ApiClient.isAdminUnlocked === 'function' && window.ApiClient.isAdminUnlocked();

    if (btn) {
      if (isUnlocked) {
        btn.textContent = '✦ จัดการหลังบ้าน (ปลดล็อกแล้ว)';
        btn.className = 'btn btn-dark btn-sm desktop-admin-btn';
      } else {
        btn.textContent = 'สำหรับฝ่ายขาย';
        btn.className = 'btn btn-outline btn-sm desktop-admin-btn';
      }
    }

    if (mobileBtn) {
      if (isUnlocked) {
        mobileBtn.textContent = '✦ จัดการหลังบ้าน (ปลดล็อกแล้ว)';
        mobileBtn.className = 'btn btn-dark btn-sm mobile-admin-link';
      } else {
        mobileBtn.textContent = 'สำหรับฝ่ายขาย / เข้าสู่ระบบ';
        mobileBtn.className = 'btn btn-outline btn-sm mobile-admin-link';
      }
    }
  }

  function setAdminToast(type, msg) {
    adminToastType = type || 'success';
    adminToastMessage = msg || '';
  }

  function sanitizeCsvCell(val) {
    var s = val === undefined || val === null ? '' : String(val).replace(/\r?\n/g, ' ').trim();
    if (/^[=+\-@\t\r]/.test(s)) {
      s = "'" + s;
    }
    return '"' + s.replace(/"/g, '""') + '"';
  }

  async function exportLeadsCsv() {
    try {
      var fullData = await window.ApiClient.getLeads({});
      var rows = (fullData && fullData.items) || [];
      if (rows.length === 0) {
        setAdminToast('error', 'ยังไม่มีรายชื่อลูกค้าสำหรับส่งออกไฟล์ CSV');
        renderAdminModal();
        return;
      }

      var headers = [
        'ลำดับอ้างอิง (ID)',
        'วันที่ลงทะเบียน',
        'ชื่อ-นามสกุลลูกค้า',
        'เบอร์โทรศัพท์',
        'LINE ID',
        'แปลงที่สนใจ',
        'ชื่อแบบบ้าน',
        'งบประมาณที่สนใจ',
        'วันที่นัดเข้าชม',
        'ช่วงเวลานัดชม',
        'สถานะการติดตาม',
        'บันทึกฝ่ายขาย / ความต้องการลูกค้า'
      ];

      var csvLines = [headers.map(sanitizeCsvCell).join(',')];

      rows.forEach(function (r) {
        var statusThai = LEAD_STATUS_LABELS[r.lead_status] || r.lead_status || 'new';
        var line = [
          r.id,
          r.created_at || '',
          r.full_name || '',
          r.phone || '',
          r.line_id || '-',
          r.resolved_plot_code || r.interested_plot || '-',
          r.property_title || 'ชมโครงการภาพรวม',
          r.budget_range || '',
          r.preferred_date || '',
          r.preferred_time || '',
          statusThai,
          r.note || ''
        ];
        csvLines.push(line.map(sanitizeCsvCell).join(','));
      });

      var csvContent = '\uFEFF' + csvLines.join('\r\n');
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      var dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.href = url;
      link.download = 'VARA_LUXE_VIP_Leads_' + dateTag + '.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);

      setAdminToast('success', 'ส่งออกไฟล์ CSV รายชื่อลูกค้า (' + rows.length + ' รายการ) เรียบร้อยแล้ว เปิดใน Microsoft Excel ได้ทันที');
      renderAdminModal();
    } catch (err) {
      setAdminToast('error', err.message || 'ไม่สามารถส่งออกไฟล์ CSV ได้');
      renderAdminModal();
    }
  }

  function renderLoginView(bodyEl) {
    updateHeaderAdminButton();
    var toastHtml = adminToastMessage
      ? '<div class="form-feedback ' + (adminToastType === 'success' ? 'feedback-success' : 'feedback-error') + '">' + esc(adminToastMessage) + '</div>'
      : '';

    bodyEl.innerHTML =
      '<div style="max-width:460px;margin:16px auto;padding:28px;background:var(--bg-ivory);border:1px solid var(--border-strong);border-radius:16px;">' +
      '  <div style="text-align:center;margin-bottom:20px;">' +
      '    <span class="eyebrow">SALES &amp; INVENTORY CMS</span>' +
      '    <h4 style="margin:6px 0 8px;font-size:1.35rem;">ปลดล็อกระบบจัดการหลังบ้าน</h4>' +
      '    <p style="margin:0;font-size:0.88rem;color:var(--text-secondary);">เฉพาะเจ้าหน้าที่ฝ่ายขายและผู้บริหารโครงการ (สิทธิ์จะถูกล็อกอัตโนมัติทันทีเมื่อปิดเบราว์เซอร์)</p>' +
      '  </div>' +
      toastHtml +
      '  <form id="adminLoginForm">' +
      '    <div class="form-group">' +
      '      <label for="adminPasscodeInput">รหัสผ่านผู้ดูแลระบบ (Admin Passcode)</label>' +
      '      <input type="password" id="adminPasscodeInput" required autocomplete="off" placeholder="กรอกรหัสผ่านฝ่ายขาย (ค่าเริ่มต้น 8899)">' +
      '    </div>' +
      '    <button type="submit" id="adminVerifySubmitBtn" class="btn btn-gold" style="width:100%;">เข้าสู่ระบบจัดการโครงการ</button>' +
      '  </form>' +
      '</div>';

    var form = document.getElementById('adminLoginForm');
    var input = document.getElementById('adminPasscodeInput');
    if (input) setTimeout(function () { input.focus(); }, 80);

    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var code = input ? input.value.trim() : '';
        if (!code) return;
        var btn = document.getElementById('adminVerifySubmitBtn');
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'กำลังตรวจสอบสิทธิ์...';
        }
        try {
          await window.ApiClient.verifyAdmin(code);
          updateHeaderAdminButton();
          setAdminToast('success', 'ปลดล็อกระบบจัดการฝ่ายขายสำเร็จแล้ว');
          await loadAndRenderDashboard();
        } catch (err) {
          setAdminToast('error', err.message || 'รหัสผ่านไม่ถูกต้อง');
          renderAdminModal();
        }
      });
    }
  }

  function getEditingPropertyObject(allProps) {
    if (!editingPropertyId || editingPropertyId === 'new') return null;
    for (var i = 0; i < allProps.length; i++) {
      if (Number(allProps[i].id) === Number(editingPropertyId)) return allProps[i];
    }
    return null;
  }

  function renderInventoryTab(allProps) {
    var availCount = 0;
    var resvCount = 0;
    var soldCount = 0;
    allProps.forEach(function (p) {
      if (p.status === 'available') availCount++;
      else if (p.status === 'reserved') resvCount++;
      else soldCount++;
    });

    var editObj = getEditingPropertyObject(allProps);
    var isFormOpen = editingPropertyId !== null;
    var formTitle = editObj
      ? 'แก้ไขข้อมูลแปลง ' + esc(editObj.plot_code) + ' (' + esc(editObj.title) + ')'
      : 'เพิ่มแปลงบ้านบิ้วอินใหม่เข้าโครงการ';

    var formHtml = '';
    if (isFormOpen) {
      var pCode = editObj ? editObj.plot_code : '';
      var pTitle = editObj ? editObj.title : '';
      var pStyle = editObj ? editObj.builtin_style : 'Warm Champagne Luxury';
      var pPrice = editObj ? editObj.price_thb : 10900000;
      var pBuiltinVal = editObj ? editObj.builtin_value_thb : 1800000;
      var pArea = editObj ? editObj.usable_area_sqm : 250;
      var pLand = editObj ? editObj.land_sqw : 60;
      var pBeds = editObj ? editObj.bedrooms : 4;
      var pBaths = editObj ? editObj.bathrooms : 4;
      var pPark = editObj ? editObj.parking : 2;
      var pMaid = editObj ? editObj.maid_rooms : 0;
      var pStatus = editObj ? editObj.status : 'available';
      var pBadge = editObj ? (editObj.highlight_badge || '') : 'พร้อมเข้าอยู่ทันที • ฟรีบิ้วอินทั้งหลัง';
      var pHero = editObj ? editObj.hero_image : 'assets/images/villa_serene_hero.jpg';
      var pSub = editObj ? editObj.subtitle : 'บ้านเดี่ยว 2 ชั้น ตกแต่งบิ้วอินครบทุกห้อง หิ้วกระเป๋าเข้าอยู่ได้ทันที';
      var pDesc = editObj ? editObj.description : 'ตกแต่งบิ้วอินด้วยวัสดุไม้กันชื้น HMR เกรด E1 ปลอดสารระเหย พร้อมชุดครัวหินควอตซ์และ Walk-in Closet';

      formHtml =
        '<div style="background:var(--bg-ivory);border:1px solid var(--gold-primary);border-radius:14px;padding:22px;margin-bottom:22px;">' +
        '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
        '    <h4 style="margin:0;font-size:1.1rem;color:var(--text-primary);">✦ ' + formTitle + '</h4>' +
        '    <button type="button" class="btn btn-outline btn-sm" id="cancelEditPropertyBtn">ยกเลิก</button>' +
        '  </div>' +
        '  <form id="adminPropertyForm">' +
        '    <div class="admin-form-grid-4">' +
        '      <div class="form-group"><label for="admPlotCode">รหัสแปลง *</label><input type="text" id="admPlotCode" required maxlength="20" value="' + esc(pCode) + '" placeholder="เช่น A-09"></div>' +
        '      <div class="form-group"><label for="admTitle">ชื่อรุ่น / แบบบ้าน *</label><input type="text" id="admTitle" required maxlength="120" value="' + esc(pTitle) + '" placeholder="เช่น Villa Serene"></div>' +
        '      <div class="form-group"><label for="admPrice">ราคาขายสุทธิ (บาท) *</label><input type="number" id="admPrice" required min="1000000" step="50000" value="' + Number(pPrice) + '"></div>' +
        '      <div class="form-group"><label for="admBuiltinVal">มูลค่าบิ้วอิน (บาท)</label><input type="number" id="admBuiltinVal" required min="0" step="50000" value="' + Number(pBuiltinVal) + '"></div>' +
        '    </div>' +
        '    <div class="admin-form-grid-4">' +
        '      <div class="form-group"><label for="admArea">พื้นที่ใช้สอย (ตร.ม.) *</label><input type="number" id="admArea" required min="50" value="' + Number(pArea) + '"></div>' +
        '      <div class="form-group"><label for="admLand">ที่ดิน (ตร.วา) *</label><input type="number" id="admLand" required min="20" step="0.5" value="' + Number(pLand) + '"></div>' +
        '      <div class="form-group"><label for="admBeds">ห้องนอน / ห้องน้ำ / จอดรถ</label>' +
        '        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">' +
        '          <input type="number" id="admBeds" min="1" max="12" value="' + Number(pBeds) + '" title="ห้องนอน" aria-label="จำนวนห้องนอน">' +
        '          <input type="number" id="admBaths" min="1" max="12" value="' + Number(pBaths) + '" title="ห้องน้ำ" aria-label="จำนวนห้องน้ำ">' +
        '          <input type="number" id="admPark" min="0" max="10" value="' + Number(pPark) + '" title="ที่จอดรถ" aria-label="จำนวนที่จอดรถ">' +
        '        </div>' +
        '      </div>' +
        '      <div class="form-group"><label for="admStatus">สถานะแปลง</label>' +
        '        <select id="admStatus">' +
        '          <option value="available"' + (pStatus === 'available' ? ' selected' : '') + '>พร้อมเข้าอยู่ (Available)</option>' +
        '          <option value="reserved"' + (pStatus === 'reserved' ? ' selected' : '') + '>จองแล้ว (Reserved)</option>' +
        '          <option value="sold"' + (pStatus === 'sold' ? ' selected' : '') + '>ขายแล้ว (Sold Out)</option>' +
        '        </select>' +
        '      </div>' +
        '    </div>' +
        '    <div class="admin-form-grid-3">' +
        '      <div class="form-group"><label for="admStyle">สไตล์งานบิ้วอิน</label><input type="text" id="admStyle" maxlength="100" value="' + esc(pStyle) + '"></div>' +
        '      <div class="form-group"><label for="admBadge">ป้ายไฮไลต์บนการ์ด</label><input type="text" id="admBadge" maxlength="100" value="' + esc(pBadge) + '"></div>' +
        '      <div class="form-group"><label for="admHero">ภาพหน้าปกบ้าน</label>' +
        '        <select id="admHero">' +
        '          <option value="assets/images/villa_serene_hero.jpg"' + (pHero.indexOf('serene') !== -1 ? ' selected' : '') + '>Type S — Villa Serene</option>' +
        '          <option value="assets/images/villa_celeste_hero.jpg"' + (pHero.indexOf('celeste') !== -1 ? ' selected' : '') + '>Type M — Villa Celeste</option>' +
        '          <option value="assets/images/villa_solaris_hero.jpg"' + (pHero.indexOf('solaris') !== -1 ? ' selected' : '') + '>Type L — Villa Solaris</option>' +
        '          <option value="assets/images/villa_imperial_hero.jpg"' + (pHero.indexOf('imperial') !== -1 ? ' selected' : '') + '>Type XL — Villa Imperial</option>' +
        '        </select>' +
        '      </div>' +
        '    </div>' +
        '    <div class="form-group"><label for="admSubtitle">คำโปรยสั้น (Subtitle)</label><input type="text" id="admSubtitle" maxlength="250" value="' + esc(pSub) + '"></div>' +
        '    <div class="form-group"><label for="admDesc">รายละเอียดบ้านและงานตกแต่งบิ้วอิน</label><textarea id="admDesc" rows="2" maxlength="1500">' + esc(pDesc) + '</textarea></div>' +
        '    <input type="hidden" id="admMaid" value="' + Number(pMaid) + '">' +
        '    <div style="display:flex;justify-content:flex-end;gap:10px;">' +
        '      <button type="submit" class="btn btn-gold btn-sm">💾 บันทึกข้อมูลแปลงบ้าน</button>' +
        '    </div>' +
        '  </form>' +
        '</div>';
    }

    var rowsHtml = allProps
      .map(function (p) {
        return (
          '<tr>' +
          '  <td><strong>' + esc(p.plot_code) + '</strong></td>' +
          '  <td>' +
          '    <div style="font-weight:700;color:var(--text-primary);">' + esc(p.title) + '</div>' +
          '    <div style="font-size:0.78rem;color:var(--text-secondary);">' + esc(p.builtin_style) + ' • บิ้วอิน ' + formatNum(p.builtin_value_thb) + ' บ.</div>' +
          '  </td>' +
          '  <td style="font-weight:700;color:var(--gold-deep);">' + formatNum(p.price_thb) + ' บ.</td>' +
          '  <td style="font-size:0.84rem;">' + Number(p.usable_area_sqm) + ' ตร.ม. / ' + Number(p.land_sqw) + ' วา<br>' + Number(p.bedrooms) + ' นอน ' + Number(p.bathrooms) + ' น้ำ ' + Number(p.parking) + ' จอด</td>' +
          '  <td>' +
          '    <select class="admin-inline-select" data-quick-status-id="' + Number(p.id) + '" aria-label="เปลี่ยนสถานะแปลง ' + esc(p.plot_code) + '">' +
          '      <option value="available"' + (p.status === 'available' ? ' selected' : '') + '>🟢 พร้อมเข้าอยู่</option>' +
          '      <option value="reserved"' + (p.status === 'reserved' ? ' selected' : '') + '>🟡 จองแล้ว</option>' +
          '      <option value="sold"' + (p.status === 'sold' ? ' selected' : '') + '>⚪ ขายแล้ว</option>' +
          '    </select>' +
          '  </td>' +
          '  <td>' +
          '    <div style="display:flex;gap:6px;">' +
          '      <button type="button" class="btn btn-outline btn-sm" data-edit-prop-id="' + Number(p.id) + '">แก้ไข</button>' +
          '      <button type="button" class="btn btn-outline btn-sm" style="color:var(--danger-text);border-color:#F5C2C0;" data-del-prop-id="' + Number(p.id) + '" data-del-plot="' + esc(p.plot_code) + '">ลบ</button>' +
          '    </div>' +
          '  </td>' +
          '</tr>'
        );
      })
      .join('');

    return (
      '<div class="admin-kpi-row">' +
      '  <div class="admin-kpi-box"><span>ยูนิตในระบบทั้งหมด</span><strong>' + allProps.length + ' แปลง</strong></div>' +
      '  <div class="admin-kpi-box"><span>พร้อมเข้าอยู่ทันที</span><strong style="color:var(--status-avail-text);">' + availCount + ' แปลง</strong></div>' +
      '  <div class="admin-kpi-box"><span>จองแล้ว</span><strong style="color:var(--status-resv-text);">' + resvCount + ' แปลง</strong></div>' +
      '  <div class="admin-kpi-box"><span>ปิดการขายแล้ว</span><strong>' + soldCount + ' แปลง</strong></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">' +
      '  <div style="font-size:0.9rem;color:var(--text-secondary);">เปลี่ยนสถานะแปลงหรือปรับราคาแล้ว หน้าเว็บหลักจะอัปเดตทันทีโดยไม่ต้องรีเฟรช</div>' +
      '  <button type="button" class="btn btn-gold btn-sm" id="openNewPropertyFormBtn">+ เพิ่มแปลงบ้านใหม่</button>' +
      '</div>' +
      formHtml +
      '<div class="admin-table-wrap">' +
      '  <table class="admin-table">' +
      '    <thead><tr><th>แปลง</th><th>แบบบ้าน &amp; สไตล์บิ้วอิน</th><th>ราคาสุทธิ</th><th>ขนาด &amp; ฟังก์ชัน</th><th>สถานะแปลง</th><th>จัดการ</th></tr></thead>' +
      '    <tbody>' + rowsHtml + '</tbody>' +
      '  </table>' +
      '</div>'
    );
  }

  function renderLeadsTab() {
    var sum = cachedLeadsData.summary || { total: 0, new: 0, contacted: 0, visited: 0, closed: 0, cancelled: 0 };
    var items = cachedLeadsData.items || [];

    var filterPills = [
      { key: 'all', label: 'ทั้งหมด (' + sum.total + ')' },
      { key: 'new', label: 'ลูกค้าใหม่ (' + sum.new + ')' },
      { key: 'contacted', label: 'ติดต่อแล้ว (' + sum.contacted + ')' },
      { key: 'visited', label: 'เข้าชมแล้ว (' + sum.visited + ')' },
      { key: 'closed', label: 'ปิดการขาย (' + sum.closed + ')' },
      { key: 'cancelled', label: 'ยกเลิกนัด (' + sum.cancelled + ')' }
    ]
      .map(function (st) {
        var activeCls = leadFilterStatus === st.key ? ' active' : '';
        return '<button type="button" class="preset-chip' + activeCls + '" data-lead-status-filter="' + st.key + '">' + st.label + '</button>';
      })
      .join('');

    var rowsHtml = items.length
      ? items
          .map(function (l) {
            return (
              '<tr>' +
              '  <td>' +
              '    <div style="font-weight:700;">' + esc(l.full_name) + '</div>' +
              '    <div style="font-size:0.8rem;color:var(--gold-deep);font-weight:600;">📞 ' + esc(l.phone) + (l.line_id ? ' • LINE: ' + esc(l.line_id) : '') + '</div>' +
              '  </td>' +
              '  <td>' +
              '    <span class="plot-pill" style="font-size:0.74rem;">แปลง ' + esc(l.resolved_plot_code || l.interested_plot || '-') + '</span>' +
              '    <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">งบ: ' + esc(l.budget_range) + '</div>' +
              '  </td>' +
              '  <td style="font-size:0.85rem;">' +
              '    <strong>' + esc(l.preferred_date) + '</strong><br>' +
              '    <span style="color:var(--text-secondary);">' + esc(l.preferred_time) + '</span>' +
              '  </td>' +
              '  <td>' +
              '    <div style="display:flex;gap:6px;align-items:center;">' +
              '      <input type="text" class="admin-note-input" data-lead-note-id="' + Number(l.id) + '" value="' + esc(l.note || '') + '" placeholder="บันทึกการคุยของเซลส์...">' +
              '      <button type="button" class="btn btn-outline btn-sm" data-save-lead-note="' + Number(l.id) + '" title="บันทึกหมายเหตุ">บันทึก</button>' +
              '    </div>' +
              '  </td>' +
              '  <td>' +
              '    <select class="admin-inline-select" data-lead-status-id="' + Number(l.id) + '" aria-label="สถานะลูกค้า ' + esc(l.full_name) + '">' +
              '      <option value="new"' + (l.lead_status === 'new' ? ' selected' : '') + '>🔵 ลูกค้าใหม่</option>' +
              '      <option value="contacted"' + (l.lead_status === 'contacted' ? ' selected' : '') + '>🟡 ติดต่อแล้ว</option>' +
              '      <option value="visited"' + (l.lead_status === 'visited' ? ' selected' : '') + '>🟣 เข้าชมแล้ว</option>' +
              '      <option value="closed"' + (l.lead_status === 'closed' ? ' selected' : '') + '>🟢 ปิดการขาย</option>' +
              '      <option value="cancelled"' + (l.lead_status === 'cancelled' ? ' selected' : '') + '>⚪ ยกเลิกนัด</option>' +
              '    </select>' +
              '  </td>' +
              '</tr>'
            );
          })
          .join('')
      : '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--text-secondary);">ไม่พบรายชื่อลูกค้าในหมวดหรือคำค้นหานี้</td></tr>';

    return (
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">' +
      '  <div style="display:flex;flex-wrap:wrap;gap:6px;">' + filterPills + '</div>' +
      '  <button type="button" class="btn btn-gold btn-sm" id="exportLeadsCsvBtn">⬇️ Export CSV (เปิดใน Excel)</button>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;">' +
      '  <input type="search" id="adminLeadSearchInput" value="' + esc(leadSearchQuery) + '" placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, LINE, รหัสแปลง..." style="flex:1;min-width:240px;padding:9px 12px;border:1px solid var(--border-strong);border-radius:8px;background:var(--bg-ivory);">' +
      '  <span style="font-size:0.84rem;color:var(--text-secondary);">พบ <strong>' + items.length + '</strong> รายการ (จากทั้งหมด ' + sum.total + ' ราย)</span>' +
      '</div>' +
      '<div class="admin-table-wrap">' +
      '  <table class="admin-table">' +
      '    <thead><tr><th>ข้อมูลลูกค้า VIP</th><th>แปลง &amp; งบประมาณ</th><th>วัน–เวลานัดชม</th><th>ความต้องการ / บันทึกฝ่ายขาย</th><th>สถานะการดูแล</th></tr></thead>' +
      '    <tbody>' + rowsHtml + '</tbody>' +
      '  </table>' +
      '</div>'
    );
  }

  function renderAdminModal() {
    var bodyEl = document.getElementById('adminCmsModalBody');
    if (!bodyEl) return;

    if (!window.ApiClient.isAdminUnlocked()) {
      renderLoginView(bodyEl);
      return;
    }

    var appState = window.LuxuryHouseApp.getState();
    var allProps = (appState && appState.allProperties) || [];
    var leadTotal = (cachedLeadsData.summary && cachedLeadsData.summary.total) || 0;

    var toastHtml = adminToastMessage
      ? '<div class="form-feedback ' + (adminToastType === 'success' ? 'feedback-success' : 'feedback-error') + '" style="margin-bottom:16px;">' + esc(adminToastMessage) + '</div>'
      : '';

    var tabBodyHtml = activeAdminTab === 'inventory' ? renderInventoryTab(allProps) : renderLeadsTab();

    bodyEl.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid var(--border-champagne);">' +
      '  <div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '    <button type="button" class="tab-btn' + (activeAdminTab === 'inventory' ? ' active' : '') + '" data-admin-tab="inventory">🏠 จัดการแปลงบ้าน &amp; ราคา (' + allProps.length + ')</button>' +
      '    <button type="button" class="tab-btn' + (activeAdminTab === 'leads' ? ' active' : '') + '" data-admin-tab="leads">📋 รายชื่อลูกค้านัดชม VIP (' + leadTotal + ')</button>' +
      '  </div>' +
      '  <button type="button" class="btn btn-outline btn-sm" id="adminLockSessionBtn">🔒 ล็อกระบบฝ่ายขาย</button>' +
      '</div>' +
      toastHtml +
      tabBodyHtml;

    bindDashboardEvents(bodyEl, allProps);
  }

  function bindDashboardEvents(bodyEl, allProps) {
    bodyEl.querySelectorAll('button[data-admin-tab]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        activeAdminTab = btn.getAttribute('data-admin-tab');
        adminToastMessage = '';
        if (activeAdminTab === 'leads') {
          await refreshLeadsData();
        }
        renderAdminModal();
      });
    });

    var lockBtn = document.getElementById('adminLockSessionBtn');
    if (lockBtn) {
      lockBtn.addEventListener('click', function () {
        window.ApiClient.clearAdminSession();
        editingPropertyId = null;
        updateHeaderAdminButton();
        setAdminToast('success', 'ล็อกสิทธิ์ผู้ดูแลระบบเรียบร้อยแล้ว');
        renderAdminModal();
      });
    }

    var newPropBtn = document.getElementById('openNewPropertyFormBtn');
    if (newPropBtn) {
      newPropBtn.addEventListener('click', function () {
        editingPropertyId = 'new';
        adminToastMessage = '';
        renderAdminModal();
      });
    }

    var cancelEditBtn = document.getElementById('cancelEditPropertyBtn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', function () {
        editingPropertyId = null;
        renderAdminModal();
      });
    }

    bodyEl.querySelectorAll('button[data-edit-prop-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        editingPropertyId = Number(btn.getAttribute('data-edit-prop-id'));
        adminToastMessage = '';
        renderAdminModal();
      });
    });

    bodyEl.querySelectorAll('select[data-quick-status-id]').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var propId = Number(sel.getAttribute('data-quick-status-id'));
        var newStatus = sel.value;
        try {
          await window.ApiClient.updateProperty(propId, { status: newStatus });
          await window.LuxuryHouseApp.refreshCatalog();
          setAdminToast('success', 'อัปเดตสถานะแปลงบ้านเรียบร้อยแล้ว หน้าเว็บหลักแสดงสถานะใหม่ทันที');
          renderAdminModal();
        } catch (err) {
          setAdminToast('error', err.message || 'ไม่สามารถเปลี่ยนสถานะแปลงได้');
          renderAdminModal();
        }
      });
    });

    bodyEl.querySelectorAll('button[data-del-prop-id]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var propId = Number(btn.getAttribute('data-del-prop-id'));
        var plotCode = btn.getAttribute('data-del-plot') || '';
        if (!window.confirm('ยืนยันการลบข้อมูลบ้านแปลง ' + plotCode + ' ออกจากระบบ? (ประวัติลูกค้าที่เคยสนใจแปลงนี้จะยังคงถูกเก็บไว้)')) {
          return;
        }
        try {
          await window.ApiClient.deleteProperty(propId);
          if (Number(editingPropertyId) === propId) editingPropertyId = null;
          await window.LuxuryHouseApp.refreshCatalog();
          setAdminToast('success', 'ลบแปลง ' + plotCode + ' เรียบร้อยแล้ว');
          renderAdminModal();
        } catch (err) {
          setAdminToast('error', err.message || 'ไม่สามารถลบแปลงบ้านได้');
          renderAdminModal();
        }
      });
    });

    var propForm = document.getElementById('adminPropertyForm');
    if (propForm) {
      propForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var priceVal = Number(document.getElementById('admPrice').value);
        var builtinVal = Number(document.getElementById('admBuiltinVal').value);
        var areaVal = Number(document.getElementById('admArea').value);

        if (priceVal < 1000000) {
          setAdminToast('error', 'กรุณาระบุราคาขายเป็นหน่วยบาทเต็ม (ขั้นต่ำ 1,000,000 บาท เช่น 12900000)');
          renderAdminModal();
          return;
        }
        if (builtinVal < 0 || builtinVal >= priceVal) {
          setAdminToast('error', 'มูลค่างานบิ้วอินต้องไม่ติดลบและต้องน้อยกว่าราคาขายบ้าน');
          renderAdminModal();
          return;
        }

        var payload = {
          plot_code: document.getElementById('admPlotCode').value.trim().toUpperCase(),
          title: document.getElementById('admTitle').value.trim(),
          price_thb: priceVal,
          builtin_value_thb: builtinVal,
          usable_area_sqm: areaVal,
          land_sqw: Number(document.getElementById('admLand').value),
          bedrooms: Number(document.getElementById('admBeds').value),
          bathrooms: Number(document.getElementById('admBaths').value),
          parking: Number(document.getElementById('admPark').value),
          maid_rooms: Number(document.getElementById('admMaid').value || 0),
          status: document.getElementById('admStatus').value,
          builtin_style: document.getElementById('admStyle').value.trim(),
          highlight_badge: document.getElementById('admBadge').value.trim(),
          hero_image: document.getElementById('admHero').value,
          subtitle: document.getElementById('admSubtitle').value.trim(),
          description: document.getElementById('admDesc').value.trim()
        };

        try {
          if (editingPropertyId === 'new') {
            payload.builtin_features = [
              {
                room_name: 'Grand Living & Dining Hall',
                feature_detail: 'ผนังทีวีบิ้วอินหิน Sintered Stone พร้อมไฟซ่อน Warm White และตู้โชว์สีทองแชมเปญ',
                material_spec: 'โครงไม้กันชื้น HMR เกรด E1 ปลอดสารระเหย + คิ้วสแตนเลสสี Champagne',
                sort_order: 1
              },
              {
                room_name: 'Master Suite Walk-in Closet',
                feature_detail: 'ตู้เสื้อผ้าบิ้วอินบานกระจกตัดแสงสูงจรดฝ้า พร้อมไฟส่องสว่างอัตโนมัติ',
                material_spec: 'เฟรมอะลูมิเนียม Champagne Anodized + บานพับ Soft-Close ยุโรป',
                sort_order: 2
              }
            ];
            payload.floor_plans = [
              {
                floor_number: 1,
                floor_label: 'ชั้น 1 (Ground Floor)',
                area_sqm: Math.round(areaVal * 0.52),
                room_summary: 'โถงรับแขก • โซนรับประทานอาหาร • Pantry & ครัวไทย • ห้องน้ำแขก • ที่จอดรถในร่ม',
                plan_image: areaVal >= 340 ? 'assets/images/plan_f1_grand.svg' : 'assets/images/plan_f1_standard.svg'
              },
              {
                floor_number: 2,
                floor_label: 'ชั้น 2 (Upper Floor)',
                area_sqm: areaVal - Math.round(areaVal * 0.52),
                room_summary: 'Master Bedroom Suite พร้อม Walk-in Closet • ห้องนอนรองพร้อมห้องน้ำในตัว • Family Area',
                plan_image: areaVal >= 340 ? 'assets/images/plan_f2_grand.svg' : 'assets/images/plan_f2_standard.svg'
              }
            ];
            await window.ApiClient.createProperty(payload);
            setAdminToast('success', 'เพิ่มแปลง ' + payload.plot_code + ' เข้าสู่โครงการเรียบร้อยแล้ว');
          } else {
            await window.ApiClient.updateProperty(editingPropertyId, payload);
            setAdminToast('success', 'บันทึกการแก้ไขแปลง ' + payload.plot_code + ' เรียบร้อยแล้ว');
          }
          editingPropertyId = null;
          await window.LuxuryHouseApp.refreshCatalog();
          renderAdminModal();
        } catch (err) {
          setAdminToast('error', err.message || 'ไม่สามารถบันทึกข้อมูลบ้านได้');
          renderAdminModal();
        }
      });
    }

    // Leads Tab Events
    bodyEl.querySelectorAll('button[data-lead-status-filter]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        leadFilterStatus = btn.getAttribute('data-lead-status-filter');
        adminToastMessage = '';
        await refreshLeadsData();
        renderAdminModal();
      });
    });

    var leadSearchEl = document.getElementById('adminLeadSearchInput');
    if (leadSearchEl) {
      leadSearchEl.addEventListener('change', async function () {
        leadSearchQuery = leadSearchEl.value.trim();
        await refreshLeadsData();
        renderAdminModal();
      });
    }

    var exportBtn = document.getElementById('exportLeadsCsvBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportLeadsCsv);
    }

    bodyEl.querySelectorAll('select[data-lead-status-id]').forEach(function (sel) {
      sel.addEventListener('change', async function () {
        var leadId = Number(sel.getAttribute('data-lead-status-id'));
        var noteInput = bodyEl.querySelector('input[data-lead-note-id="' + leadId + '"]');
        var noteVal = noteInput ? noteInput.value.trim() : undefined;
        try {
          await window.ApiClient.updateLeadStatus(leadId, {
            lead_status: sel.value,
            note: noteVal
          });
          setAdminToast('success', 'อัปเดตสถานะการดูแลลูกค้าเรียบร้อยแล้ว');
          await refreshLeadsData();
          renderAdminModal();
        } catch (err) {
          setAdminToast('error', err.message || 'ไม่สามารถอัปเดตสถานะลูกค้าได้');
          renderAdminModal();
        }
      });
    });

    bodyEl.querySelectorAll('button[data-save-lead-note]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var leadId = Number(btn.getAttribute('data-save-lead-note'));
        var noteInput = bodyEl.querySelector('input[data-lead-note-id="' + leadId + '"]');
        var statusSel = bodyEl.querySelector('select[data-lead-status-id="' + leadId + '"]');
        try {
          await window.ApiClient.updateLeadStatus(leadId, {
            lead_status: statusSel ? statusSel.value : 'new',
            note: noteInput ? noteInput.value.trim() : ''
          });
          setAdminToast('success', 'บันทึกหมายเหตุฝ่ายขายเรียบร้อยแล้ว');
          await refreshLeadsData();
          renderAdminModal();
        } catch (err) {
          setAdminToast('error', err.message || 'ไม่สามารถบันทึกหมายเหตุได้');
          renderAdminModal();
        }
      });
    });
  }

  async function refreshLeadsData() {
    try {
      cachedLeadsData = await window.ApiClient.getLeads({
        status: leadFilterStatus,
        search: leadSearchQuery
      });
    } catch (_) {}
  }

  async function loadAndRenderDashboard() {
    if (window.ApiClient.isAdminUnlocked()) {
      await refreshLeadsData();
    }
    renderAdminModal();
  }

  async function openDashboard() {
    var modal = document.getElementById('adminCmsModal');
    if (!modal) return;
    lastFocusedTrigger = document.activeElement;
    adminToastMessage = '';
    await loadAndRenderDashboard();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeDashboard() {
    var modal = document.getElementById('adminCmsModal');
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
    }
  }

  function bindModalEvents() {
    var modal = document.getElementById('adminCmsModal');
    var closeBtn = document.getElementById('closeAdminCmsModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeDashboard);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeDashboard();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) {
        closeDashboard();
      }
    });
    updateHeaderAdminButton();
  }

  document.addEventListener('DOMContentLoaded', bindModalEvents);

  window.AdminCms = {
    openDashboard: openDashboard,
    closeDashboard: closeDashboard,
    exportLeadsCsv: exportLeadsCsv
  };
})(window);

