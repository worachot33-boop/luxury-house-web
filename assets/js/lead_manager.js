(function (window) {
  'use strict';

  function getBangkokDateOffsetIso(daysOffset) {
    var now = new Date();
    now.setDate(now.getDate() + (Number(daysOffset) || 0));
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
    } catch (_) {
      return now.toISOString().slice(0, 10);
    }
  }

  function isValidThaiPhoneClient(phoneStr) {
    var cleaned = String(phoneStr || '').replace(/[\s\-().]/g, '');
    return /^(?:\+66|66)0?[2-9]\d{7,8}$|^0[2-9]\d{7,8}$/.test(cleaned);
  }

  function budgetBucketFromPrice(priceThb) {
    var p = Number(priceThb) || 0;
    if (p <= 12000000) return '8 - 12 ล้านบาท';
    if (p <= 16000000) return '12 - 16 ล้านบาท';
    return '16 - 20 ล้านบาท';
  }

  function populateBookingPropertyDropdown(properties) {
    var selectEl = document.getElementById('leadPropertySelect');
    if (!selectEl) return;

    var list = Array.isArray(properties) ? properties : [];
    var currentVal = selectEl.value;
    var html = '<option value="">-- เลือกชมทุกแบบบ้านที่พร้อมเข้าอยู่ --</option>';

    list.forEach(function (prop) {
      var statusText = prop.status === 'available' ? 'พร้อมเข้าอยู่' : prop.status === 'reserved' ? 'จองแล้ว - ชมบ้านเทียบเคียงได้' : 'ขายแล้ว';
      var million = (Number(prop.price_thb) / 1000000).toFixed(2).replace(/\.00$/, '');
      html +=
        '<option value="' + Number(prop.id) + '" data-plot="' + window.PropertyCatalog.escapeHtml(prop.plot_code) + '">' +
        'แปลง ' + window.PropertyCatalog.escapeHtml(prop.plot_code) + ' — ' +
        window.PropertyCatalog.escapeHtml(prop.title) + ' (' + million + ' ล้าน • ' + statusText + ')' +
        '</option>';
    });

    selectEl.innerHTML = html;
    if (currentVal) selectEl.value = currentVal;
  }

  function prefillBookingForProperty(property, extraNote) {
    var selectEl = document.getElementById('leadPropertySelect');
    var budgetEl = document.getElementById('leadBudgetSelect');
    var noteEl = document.getElementById('leadNoteInput');

    if (property && selectEl) {
      selectEl.value = String(property.id);
    }
    if (property && budgetEl) {
      budgetEl.value = budgetBucketFromPrice(property.price_thb);
    }
    if (extraNote && noteEl && !noteEl.value.trim()) {
      noteEl.value = 'สนใจปรึกษาแผนสินเชื่อเบื้องต้น (ยอดผ่อนประเมิน ' + extraNote + ')';
    }

    var section = document.getElementById('bookingSection');
    if (section && typeof section.scrollIntoView === 'function') {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    var nameInput = document.getElementById('leadFullNameInput');
    if (nameInput) {
      setTimeout(function () { nameInput.focus(); }, 450);
    }
  }

  function showFeedback(type, message) {
    var box = document.getElementById('leadFormFeedback');
    if (!box) return;
    box.hidden = false;
    box.className = 'form-feedback ' + (type === 'success' ? 'feedback-success' : 'feedback-error');
    box.textContent = message;
    if (typeof box.scrollIntoView === 'function') {
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function initBookingForm() {
    var dateInput = document.getElementById('leadPreferredDate');
    var todayIso = getBangkokDateOffsetIso(0);
    var tomorrowIso = getBangkokDateOffsetIso(1);

    if (dateInput) {
      dateInput.min = todayIso;
      if (!dateInput.value) {
        dateInput.value = tomorrowIso;
      }
    }

    var form = document.getElementById('vipBookingForm');
    var submitBtn = document.getElementById('leadSubmitBtn');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var fullName = (document.getElementById('leadFullNameInput').value || '').trim();
      var phone = (document.getElementById('leadPhoneInput').value || '').trim();
      var lineId = (document.getElementById('leadLineInput').value || '').trim();
      var propSelect = document.getElementById('leadPropertySelect');
      var propId = propSelect && propSelect.value ? Number(propSelect.value) : null;
      var selectedOption = propSelect && propSelect.options[propSelect.selectedIndex];
      var interestedPlot = selectedOption ? (selectedOption.getAttribute('data-plot') || '') : '';
      var budgetRange = (document.getElementById('leadBudgetSelect').value || '8 - 12 ล้านบาท').trim();
      var preferredDate = (document.getElementById('leadPreferredDate').value || '').trim();
      var preferredTime = (document.getElementById('leadPreferredTime').value || '10:00 - 12:00').trim();
      var note = (document.getElementById('leadNoteInput').value || '').trim();

      if (fullName.length < 2) {
        showFeedback('error', 'กรุณาระบุชื่อ-นามสกุลผู้ติดต่ออย่างน้อย 2 ตัวอักษร');
        return;
      }
      if (!isValidThaiPhoneClient(phone)) {
        showFeedback('error', 'กรุณาระบุเบอร์โทรศัพท์ไทยที่ถูกต้อง (เช่น 081-234-5678)');
        return;
      }
      if (!preferredDate || preferredDate < getBangkokDateOffsetIso(0)) {
        showFeedback('error', 'กรุณาเลือกวันที่นัดชมตั้งแต่วันนี้เป็นต้นไป');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังบันทึกนัดหมายส่วนตัว...';
      }

      try {
        var response = await window.ApiClient.createLead({
          property_id: propId,
          interested_plot: interestedPlot,
          full_name: fullName,
          phone: phone,
          line_id: lineId,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
          budget_range: budgetRange,
          note: note
        });

        var saved = response.lead;
        var plotText = saved && saved.interested_plot ? ' (แปลง ' + saved.interested_plot + ')' : '';
        showFeedback(
          'success',
          'ลงทะเบียนนัดชมโครงการแบบ VIP สำเร็จแล้ว' + plotText +
            ' • เจ้าหน้าที่ Private Concierge จะติดต่อยืนยันคุณ ' + fullName + ' ตามวันที่ ' + preferredDate + ' ครับ'
        );

        form.reset();
        if (dateInput) {
          dateInput.min = getBangkokDateOffsetIso(0);
          dateInput.value = getBangkokDateOffsetIso(1);
        }
      } catch (err) {
        showFeedback('error', err.message || 'ไม่สามารถส่งข้อมูลได้ในขณะนี้ กรุณาโทรติดต่อโครงการโดยตรง');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ยืนยันนัดหมายชมบ้านจริงแบบส่วนตัว (VIP)';
        }
      }
    });
  }

  function bindLineButtons(brand) {
    var lineId = (brand && brand.lineId) || '@aurelia.residence';
    document.querySelectorAll('[data-action="copy-line"]').forEach(function (btn) {
      var defaultLabel = btn.textContent;
      btn.addEventListener('click', function () {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(lineId).then(function () {
            btn.textContent = '✓ คัดลอก LINE ' + lineId + ' แล้ว';
            setTimeout(function () {
              btn.textContent = defaultLabel;
            }, 2600);
          }).catch(function () {
            window.alert('เพิ่มเพื่อนผ่าน LINE Official Account: ' + lineId);
          });
        } else {
          window.alert('เพิ่มเพื่อนผ่าน LINE Official Account: ' + lineId);
        }
      });
    });
  }

  window.LeadManager = {
    populateBookingPropertyDropdown: populateBookingPropertyDropdown,
    prefillBookingForProperty: prefillBookingForProperty,
    initBookingForm: initBookingForm,
    bindLineButtons: bindLineButtons
  };
})(window);

