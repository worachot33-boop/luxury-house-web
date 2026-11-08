(function (window) {
  'use strict';

  var activeModalProperty = null;
  var activeTab = 'builtin';
  var activeFloorIdx = 0;
  var lastFocusedElement = null;

  function escapeHtml(val) {
    if (val === undefined || val === null) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeAssetSrc(src) {
    var s = String(src || '').trim();
    if (/^(assets\/|https?:\/\/|data:image\/)/i.test(s)) {
      return escapeHtml(s);
    }
    return 'assets/images/villa_serene_hero.jpg';
  }

  function formatMillion(thb) {
    var num = Number(thb) || 0;
    return (num / 1000000).toFixed(2).replace(/\.00$/, '') + ' ล้านบาท';
  }

  function formatThb(thb) {
    var num = Math.round(Number(thb) || 0);
    return num.toLocaleString('th-TH') + ' บาท';
  }

  function getStatusMeta(status) {
    if (status === 'available') {
      return { label: 'พร้อมเข้าอยู่', className: 'status-available' };
    }
    if (status === 'reserved') {
      return { label: 'จองแล้ว', className: 'status-reserved' };
    }
    return { label: 'ขายแล้ว', className: 'status-sold' };
  }

  function initCompareSlider() {
    var wrapper = document.getElementById('builtinCompareWidget');
    var rangeInput = document.getElementById('builtinCompareRange');
    if (!wrapper || !rangeInput) return;

    function updateSplit() {
      var pct = Math.min(100, Math.max(0, Number(rangeInput.value) || 54));
      wrapper.style.setProperty('--split', pct + '%');
    }

    rangeInput.addEventListener('input', updateSplit);
    rangeInput.addEventListener('change', updateSplit);
    updateSplit();
  }

  function renderCatalog(properties, callbacks) {
    var gridEl = document.getElementById('propertyGrid');
    var countEl = document.getElementById('catalogCountLabel');
    if (!gridEl) return;

    var list = Array.isArray(properties) ? properties : [];
    if (countEl) {
      countEl.textContent = 'แสดงแบบบ้านและแปลงที่เปิดขาย ' + list.length + ' รายการ';
    }

    if (list.length === 0) {
      gridEl.innerHTML =
        '<div class="empty-catalog-box" style="grid-column: 1 / -1;">' +
        '<h3 style="margin:0 0 8px;">ไม่พบแปลงบ้านที่ตรงกับเงื่อนไขการกรอง</h3>' +
        '<p style="margin:0 0 18px;color:var(--text-secondary);">ลองปรับช่วงงบประมาณ หรือกดล้างตัวกรองเพื่อชมบ้านบิ้วอินทั้งหมดในโครงการ</p>' +
        '<button type="button" class="btn btn-outline" id="emptyResetFilterBtn">ดูบ้านทั้งหมดในโครงการ</button>' +
        '</div>';

      var resetBtn = document.getElementById('emptyResetFilterBtn');
      if (resetBtn && callbacks && typeof callbacks.onResetFilters === 'function') {
        resetBtn.addEventListener('click', callbacks.onResetFilters);
      }
      return;
    }

    var cardsHtml = list
      .map(function (prop) {
        var statusMeta = getStatusMeta(prop.status);
        var builtinMillion = ((Number(prop.builtin_value_thb) || 0) / 1000000).toFixed(1).replace(/\.0$/, '');
        var maidTag = Number(prop.maid_rooms) > 0 ? ' + ' + Number(prop.maid_rooms) + ' ห้องแม่บ้าน' : '';

        return (
          '<article class="property-card" data-property-id="' + Number(prop.id) + '">' +
          '  <div class="card-media">' +
          '    <img src="' + safeAssetSrc(prop.hero_image) + '" alt="' + escapeHtml(prop.title) + ' แปลง ' + escapeHtml(prop.plot_code) + '" loading="lazy" decoding="async">' +
          '    <div class="card-top-badges">' +
          '      <span class="plot-pill">แปลง ' + escapeHtml(prop.plot_code) + '</span>' +
          '      <span class="status-badge ' + statusMeta.className + '">' + statusMeta.label + '</span>' +
          '    </div>' +
          (Number(prop.builtin_value_thb) > 0
            ? '<div class="builtin-ribbon">✦ รวมงานบิ้วอินมูลค่า ' + escapeHtml(builtinMillion) + ' ล้านบาท</div>'
            : '') +
          '  </div>' +
          '  <div class="card-body">' +
          '    <div class="card-header-row">' +
          '      <div>' +
          '        <h3 class="card-title">' + escapeHtml(prop.title) + '</h3>' +
          '        <span style="font-size:0.8rem;color:var(--gold-deep);font-weight:600;">สไตล์: ' + escapeHtml(prop.builtin_style) + '</span>' +
          '      </div>' +
          '      <div class="card-price">' +
          '        <span class="price-million">' + escapeHtml(formatMillion(prop.price_thb)) + '</span>' +
          '        <span class="price-full-thb">' + escapeHtml(formatThb(prop.price_thb)) + '</span>' +
          '      </div>' +
          '    </div>' +
          '    <p class="card-subtitle">' + escapeHtml(prop.subtitle) + '</p>' +
          '    <div class="specs-strip">' +
          '      <div class="spec-item"><strong>' + Number(prop.usable_area_sqm) + ' ตร.ม.</strong><span>พื้นที่ใช้สอย</span></div>' +
          '      <div class="spec-item"><strong>' + Number(prop.land_sqw) + ' ตร.วา</strong><span>ขนาดที่ดิน</span></div>' +
          '      <div class="spec-item"><strong>' + Number(prop.bedrooms) + ' นอน / ' + Number(prop.bathrooms) + ' น้ำ</strong><span>ห้องพัก' + escapeHtml(maidTag) + '</span></div>' +
          '      <div class="spec-item"><strong>' + Number(prop.parking) + ' คัน</strong><span>ที่จอดรถในร่ม</span></div>' +
          '    </div>' +
          '    <div class="card-actions">' +
          '      <button type="button" class="btn btn-gold btn-sm" data-action="open-detail" data-id="' + Number(prop.id) + '">ดูสเปกบิ้วอิน &amp; แปลนบ้าน</button>' +
          '      <button type="button" class="btn btn-outline btn-sm" data-action="calc-unit" data-id="' + Number(prop.id) + '">คำนวณยอดผ่อน</button>' +
          '    </div>' +
          '  </div>' +
          '</article>'
        );
      })
      .join('');

    gridEl.innerHTML = cardsHtml;

    gridEl.querySelectorAll('button[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var propId = Number(btn.getAttribute('data-id'));
        var action = btn.getAttribute('data-action');
        var targetProp = null;
        for (var i = 0; i < list.length; i++) {
          if (Number(list[i].id) === propId) {
            targetProp = list[i];
            break;
          }
        }
        if (!targetProp) return;

        if (action === 'open-detail') {
          openDetailModal(targetProp, callbacks);
        } else if (action === 'calc-unit' && callbacks && typeof callbacks.onSelectForMortgage === 'function') {
          callbacks.onSelectForMortgage(targetProp);
        }
      });
    });
  }

  function renderModalContent(callbacks) {
    var bodyEl = document.getElementById('propertyModalBody');
    var titleEl = document.getElementById('propertyModalTitle');
    if (!bodyEl || !activeModalProperty) return;

    var p = activeModalProperty;
    var statusMeta = getStatusMeta(p.status);
    if (titleEl) {
      titleEl.innerHTML =
        'แปลง ' + escapeHtml(p.plot_code) + ' — ' + escapeHtml(p.title) +
        ' <span class="status-badge ' + statusMeta.className + '" style="margin-left:8px;vertical-align:middle;">' + statusMeta.label + '</span>';
    }

    var features = Array.isArray(p.builtin_features) ? p.builtin_features : [];
    var plans = Array.isArray(p.floor_plans) ? p.floor_plans : [];
    if (activeFloorIdx >= plans.length) activeFloorIdx = 0;

    var tabContentHtml = '';
    if (activeTab === 'builtin') {
      var featCards = features.length
        ? features
            .map(function (f) {
              return (
                '<div class="builtin-spec-card">' +
                '  <h4 style="margin:0 0 6px;color:var(--text-primary);">✦ ' + escapeHtml(f.room_name) + '</h4>' +
                '  <p style="margin:0 0 6px;font-size:0.93rem;color:var(--text-secondary);">' + escapeHtml(f.feature_detail) + '</p>' +
                '  <div style="font-size:0.82rem;color:var(--gold-deep);font-weight:600;">สเปกวัสดุ: ' + escapeHtml(f.material_spec) + '</div>' +
                '</div>'
              );
            })
            .join('')
        : '<p style="color:var(--text-secondary);">ตกแต่งบิ้วอินมาตรฐานโครงการครบทุกห้องหลัก</p>';

      tabContentHtml =
        '<p style="margin:0 0 18px;color:var(--text-secondary);">' + escapeHtml(p.description) + '</p>' +
        '<div class="builtin-spec-list">' + featCards + '</div>';
    } else {
      if (plans.length === 0) {
        tabContentHtml = '<p style="color:var(--text-secondary);">กรุณาติดต่อฝ่ายขายเพื่อรับไฟล์แปลนบ้านฉบับเต็ม</p>';
      } else {
        var currentPlan = plans[activeFloorIdx] || plans[0];
        var floorBtns = plans
          .map(function (pl, idx) {
            var isAct = idx === activeFloorIdx ? ' active' : '';
            return (
              '<button type="button" class="tab-btn' + isAct + '" data-floor-idx="' + idx + '">' +
              escapeHtml(pl.floor_label) + ' (' + Number(pl.area_sqm) + ' ตร.ม.)' +
              '</button>'
            );
          })
          .join('');

        tabContentHtml =
          '<div class="floor-switcher-bar">' + floorBtns + '</div>' +
          '<p style="margin:0 0 14px;font-size:0.92rem;color:var(--text-secondary);"><strong>การจัดวางพื้นที่:</strong> ' +
          escapeHtml(currentPlan.room_summary) + '</p>' +
          '<div class="floor-plan-frame">' +
          '  <img src="' + safeAssetSrc(currentPlan.plan_image) + '" alt="' + escapeHtml(currentPlan.floor_label) + '">' +
          '</div>';
      }
    }

    bodyEl.innerHTML =
      '<div class="modal-hero-summary">' +
      '  <img src="' + safeAssetSrc(p.hero_image) + '" alt="' + escapeHtml(p.title) + '" style="border-radius:14px;aspect-ratio:16/10;object-fit:cover;width:100%;">' +
      '  <div style="background:var(--bg-ivory);padding:20px;border-radius:14px;border:1px solid var(--border-champagne);">' +
      '    <div style="font-size:0.82rem;color:var(--gold-deep);font-weight:700;">ราคาขายสุทธิ (รวมบิ้วอินพร้อมอยู่)</div>' +
      '    <div style="font-size:1.8rem;font-weight:700;color:var(--text-primary);line-height:1.2;margin:4px 0;">' + escapeHtml(formatMillion(p.price_thb)) + '</div>' +
      '    <div style="font-size:0.84rem;color:var(--text-muted);margin-bottom:14px;">(' + escapeHtml(formatThb(p.price_thb)) + ' • มูลค่าบิ้วอิน ' + escapeHtml(formatThb(p.builtin_value_thb)) + ')</div>' +
      '    <div style="font-size:0.9rem;color:var(--text-secondary);display:grid;gap:6px;margin-bottom:18px;">' +
      '      <div>• พื้นที่ใช้สอย <strong>' + Number(p.usable_area_sqm) + ' ตร.ม.</strong> | ที่ดิน <strong>' + Number(p.land_sqw) + ' ตร.วา</strong></div>' +
      '      <div>• <strong>' + Number(p.bedrooms) + ' ห้องนอน</strong> • <strong>' + Number(p.bathrooms) + ' ห้องน้ำ</strong> • จอดรถ <strong>' + Number(p.parking) + ' คัน</strong></div>' +
      (p.highlight_badge ? '      <div>• ไฮไลต์: <strong>' + escapeHtml(p.highlight_badge) + '</strong></div>' : '') +
      '    </div>' +
      '    <div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '      <button type="button" class="btn btn-gold btn-sm" id="modalBookUnitBtn">นัดชมบ้านแปลงนี้</button>' +
      '      <button type="button" class="btn btn-outline btn-sm" id="modalCalcUnitBtn">คำนวณยอดผ่อน</button>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div class="modal-tabs">' +
      '  <button type="button" class="tab-btn' + (activeTab === 'builtin' ? ' active' : '') + '" data-modal-tab="builtin">รายการตกแต่งบิ้วอิน (' + features.length + ' โซนหลัก)</button>' +
      '  <button type="button" class="tab-btn' + (activeTab === 'floorplan' ? ' active' : '') + '" data-modal-tab="floorplan">แปลนบ้าน ชั้น 1 – ชั้น 2</button>' +
      '</div>' +
      '<div>' + tabContentHtml + '</div>';

    bodyEl.querySelectorAll('button[data-modal-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTab = btn.getAttribute('data-modal-tab');
        renderModalContent(callbacks);
      });
    });

    bodyEl.querySelectorAll('button[data-floor-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeFloorIdx = Number(btn.getAttribute('data-floor-idx')) || 0;
        renderModalContent(callbacks);
      });
    });

    var bookBtn = document.getElementById('modalBookUnitBtn');
    if (bookBtn) {
      bookBtn.addEventListener('click', function () {
        var selected = activeModalProperty;
        closeDetailModal();
        if (callbacks && typeof callbacks.onSelectForBooking === 'function') {
          callbacks.onSelectForBooking(selected);
        }
      });
    }

    var calcBtn = document.getElementById('modalCalcUnitBtn');
    if (calcBtn) {
      calcBtn.addEventListener('click', function () {
        var selected = activeModalProperty;
        closeDetailModal();
        if (callbacks && typeof callbacks.onSelectForMortgage === 'function') {
          callbacks.onSelectForMortgage(selected);
        }
      });
    }
  }

  function openDetailModal(property, callbacks) {
    var modal = document.getElementById('propertyDetailModal');
    if (!modal || !property) return;

    lastFocusedElement = document.activeElement;
    activeModalProperty = property;
    activeTab = 'builtin';
    activeFloorIdx = 0;

    renderModalContent(callbacks);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    var closeBtn = document.getElementById('closePropertyModalBtn');
    if (closeBtn) closeBtn.focus();
  }

  function closeDetailModal() {
    var modal = document.getElementById('propertyDetailModal');
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    activeModalProperty = null;
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  function bindModalEvents() {
    var modal = document.getElementById('propertyDetailModal');
    var closeBtn = document.getElementById('closePropertyModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeDetailModal);
    }
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeDetailModal();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) {
        closeDetailModal();
      }
    });
  }

  window.PropertyCatalog = {
    escapeHtml: escapeHtml,
    formatMillion: formatMillion,
    formatThb: formatThb,
    getStatusMeta: getStatusMeta,
    initCompareSlider: initCompareSlider,
    bindModalEvents: bindModalEvents,
    renderCatalog: renderCatalog,
    openDetailModal: openDetailModal,
    closeDetailModal: closeDetailModal
  };
})(window);

