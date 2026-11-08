(function (window) {
  'use strict';

  var AUTH_SESSION_KEY = 'aurelia_admin_passcode_session';
  var LOCAL_PROPERTIES_CACHE_KEY = 'aurelia_properties_offline_cache_v1';
  var LOCAL_LEADS_CACHE_KEY = 'aurelia_leads_offline_cache_v1';

  var isFileProtocol = window.location.protocol === 'file:';

  // Strict Storage Boundary: Admin passcode is stored ONLY in sessionStorage
  function getAdminPasscode() {
    try {
      return window.sessionStorage.getItem(AUTH_SESSION_KEY) || '';
    } catch (_) {
      return '';
    }
  }

  function setAdminPasscode(code) {
    try {
      if (code) {
        window.sessionStorage.setItem(AUTH_SESSION_KEY, String(code));
      } else {
        window.sessionStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch (_) {}
  }

  function clearAdminSession() {
    setAdminPasscode('');
  }

  function isAdminUnlocked() {
    return Boolean(getAdminPasscode());
  }

  function getCachedProperties() {
    try {
      var raw = window.localStorage.getItem(LOCAL_PROPERTIES_CACHE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return (window.InitialHouseData && window.InitialHouseData.PROPERTIES) || [];
  }

  function setCachedProperties(list) {
    try {
      if (Array.isArray(list)) {
        window.localStorage.setItem(LOCAL_PROPERTIES_CACHE_KEY, JSON.stringify(list));
      }
    } catch (_) {}
  }

  function getOfflineLeads() {
    try {
      var raw = window.localStorage.getItem(LOCAL_LEADS_CACHE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    var defaultLeads = [
      {
        id: 1,
        property_id: 2,
        interested_plot: 'A-08',
        resolved_plot_code: 'A-08',
        property_title: 'Villa Celeste',
        full_name: 'คุณณัฐพล วงศ์สุวรรณ',
        phone: '081-945-2890',
        line_id: 'nattapol.w',
        preferred_date: '2026-11-14',
        preferred_time: '10:30 - 12:00',
        budget_range: '12 - 16 ล้านบาท',
        note: 'สนใจบ้านแปลงมุมที่มีห้องนอนผู้สูงอายุชั้นล่าง อยากดูงานบิ้วอินจริงวันเสาร์นี้ครับ',
        lead_status: 'contacted',
        created_at: '2026-11-08 09:30:00'
      },
      {
        id: 2,
        property_id: 4,
        interested_plot: 'V-01',
        resolved_plot_code: 'V-01',
        property_title: 'Villa Imperial — The Grand Manor',
        full_name: 'พญ.พิมพ์ชนก อัศวเมธี',
        phone: '089-782-6541',
        line_id: 'dr.pimchanok',
        preferred_date: '2026-11-15',
        preferred_time: '14:00 - 16:00',
        budget_range: '16 - 20 ล้านบาท',
        note: 'มองหาบ้านพร้อมอยู่ไม่ต้องทำบิ้วอินเพิ่ม ที่จอดรถอย่างน้อย 3-4 คันค่ะ',
        lead_status: 'new',
        created_at: '2026-11-08 10:05:00'
      }
    ];
    return defaultLeads;
  }

  function saveOfflineLead(leadPayload) {
    var list = getOfflineLeads();
    var props = getCachedProperties();
    var matchedProp = null;
    for (var i = 0; i < props.length; i++) {
      if (Number(props[i].id) === Number(leadPayload.property_id)) {
        matchedProp = props[i];
        break;
      }
    }
    var newEntry = {
      id: Date.now(),
      property_id: matchedProp ? matchedProp.id : null,
      interested_plot: matchedProp ? matchedProp.plot_code : (leadPayload.interested_plot || ''),
      resolved_plot_code: matchedProp ? matchedProp.plot_code : (leadPayload.interested_plot || '-'),
      property_title: matchedProp ? matchedProp.title : '',
      full_name: leadPayload.full_name,
      phone: leadPayload.phone,
      line_id: leadPayload.line_id || '',
      preferred_date: leadPayload.preferred_date,
      preferred_time: leadPayload.preferred_time || '10:00 - 12:00',
      budget_range: leadPayload.budget_range || '8 - 12 ล้านบาท',
      note: leadPayload.note || '',
      lead_status: 'new',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    list.unshift(newEntry);
    try {
      window.localStorage.setItem(LOCAL_LEADS_CACHE_KEY, JSON.stringify(list));
    } catch (_) {}
    return newEntry;
  }

  function filterPropertiesLocally(list, filters) {
    var f = filters || {};
    var result = list.slice();

    if (f.minPrice !== undefined && f.minPrice !== '') {
      var minP = Number(f.minPrice);
      result = result.filter(function (p) { return p.price_thb >= minP; });
    }
    if (f.maxPrice !== undefined && f.maxPrice !== '') {
      var maxP = Number(f.maxPrice);
      result = result.filter(function (p) { return p.price_thb <= maxP; });
    }
    if (f.status && f.status !== 'all') {
      result = result.filter(function (p) { return p.status === f.status; });
    }
    if (f.bedrooms && f.bedrooms !== 'all') {
      var bed = Number(f.bedrooms);
      result = result.filter(function (p) { return Number(p.bedrooms) === bed; });
    }
    if (f.search && String(f.search).trim() !== '') {
      var kw = String(f.search).trim().toLowerCase();
      result = result.filter(function (p) {
        return (
          String(p.plot_code || '').toLowerCase().indexOf(kw) !== -1 ||
          String(p.title || '').toLowerCase().indexOf(kw) !== -1 ||
          String(p.subtitle || '').toLowerCase().indexOf(kw) !== -1 ||
          String(p.builtin_style || '').toLowerCase().indexOf(kw) !== -1 ||
          String(p.description || '').toLowerCase().indexOf(kw) !== -1
        );
      });
    }

    if (f.sort === 'price_desc') {
      result.sort(function (a, b) { return b.price_thb - a.price_thb; });
    } else if (f.sort === 'area_desc') {
      result.sort(function (a, b) { return b.usable_area_sqm - a.usable_area_sqm; });
    } else {
      result.sort(function (a, b) { return a.price_thb - b.price_thb; });
    }

    return result;
  }

  async function requestJson(url, options) {
    var opts = options || {};
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    var adminCode = getAdminPasscode();
    if (adminCode) {
      headers['X-Admin-Passcode'] = adminCode;
    }

    var response = await window.fetch(url, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });

    var json = null;
    try {
      json = await response.json();
    } catch (_) {
      var err = new Error('ไม่พบ API หรือบริการบนโฮสติ้งนี้');
      err.status = response.status || 404;
      throw err;
    }

    if (!response.ok || !json || !json.success) {
      if (response.status === 401 && adminCode) {
        clearAdminSession();
      }
      var err = new Error((json && json.error) || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      err.status = response.status;
      throw err;
    }
    return json.data;
  }

  async function getBrand() {
    if (isFileProtocol) {
      return {
        brand: (window.InitialHouseData && window.InitialHouseData.BRAND) || {},
        isOfflineFallback: true
      };
    }
    try {
      var data = await requestJson('/api/brand');
      return { brand: data, isOfflineFallback: false };
    } catch (_) {
      return {
        brand: (window.InitialHouseData && window.InitialHouseData.BRAND) || {},
        isOfflineFallback: true
      };
    }
  }

  async function getProperties(filters) {
    var f = filters || {};
    if (!isFileProtocol) {
      try {
        var params = new URLSearchParams();
        Object.keys(f).forEach(function (k) {
          if (f[k] !== undefined && f[k] !== null && f[k] !== '' && f[k] !== 'all') {
            params.set(k, String(f[k]));
          }
        });
        var qs = params.toString();
        var url = '/api/properties' + (qs ? '?' + qs : '');
        var data = await requestJson(url);
        if (!qs) {
          setCachedProperties(data);
        }
        return { items: data, isOfflineFallback: false };
      } catch (err) {
        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 404) {
          throw err;
        }
      }
    }

    var cached = getCachedProperties();
    return {
      items: filterPropertiesLocally(cached, f),
      isOfflineFallback: true
    };
  }

  async function createLead(payload) {
    if (!isFileProtocol) {
      try {
        var created = await requestJson('/api/leads', {
          method: 'POST',
          body: payload
        });
        return { lead: created, isOfflineFallback: false };
      } catch (err) {
        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 404) {
          throw err;
        }
      }
    }
    var savedOffline = saveOfflineLead(payload);
    return { lead: savedOffline, isOfflineFallback: true };
  }

  async function verifyAdmin(passcode) {
    if (isFileProtocol) {
      if (String(passcode).trim() === '8899') {
        setAdminPasscode('8899');
        return { verified: true, isOfflineFallback: true };
      }
      throw new Error('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
    }
    try {
      var res = await requestJson('/api/admin/verify', {
        method: 'POST',
        body: { passcode: passcode }
      });
      setAdminPasscode(passcode);
      return res;
    } catch (err) {
      if (err.status === 404) {
        if (String(passcode).trim() === '8899') {
          setAdminPasscode('8899');
          return { verified: true, isOfflineFallback: true };
        }
        throw new Error('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
      }
      throw err;
    }
  }

  function localCreateProperty(payload) {
    var list = getCachedProperties();
    var newProp = Object.assign(
      {
        id: Date.now(),
        builtin_features: [],
        floor_plans: []
      },
      payload
    );
    list.push(newProp);
    setCachedProperties(list);
    return newProp;
  }

  function localUpdateProperty(id, payload) {
    var list = getCachedProperties();
    var updated = null;
    for (var i = 0; i < list.length; i++) {
      if (Number(list[i].id) === Number(id)) {
        list[i] = Object.assign({}, list[i], payload);
        updated = list[i];
        break;
      }
    }
    if (!updated) throw new Error('ไม่พบแปลงบ้านที่ต้องการแก้ไข');
    setCachedProperties(list);
    return updated;
  }

  function localDeleteProperty(id) {
    var list = getCachedProperties().filter(function (p) {
      return Number(p.id) !== Number(id);
    });
    setCachedProperties(list);
    return { deletedId: Number(id) };
  }

  function localGetLeads(filters) {
    var allItems = getOfflineLeads();
    var f = filters || {};
    var summary = { total: 0, new: 0, contacted: 0, visited: 0, closed: 0, cancelled: 0 };
    allItems.forEach(function (item) {
      var st = item.lead_status || 'new';
      if (summary[st] !== undefined) summary[st] += 1;
      summary.total += 1;
    });
    var filtered = allItems.filter(function (item) {
      if (f.status && f.status !== 'all' && item.lead_status !== f.status) return false;
      if (f.search && String(f.search).trim() !== '') {
        var kw = String(f.search).trim().toLowerCase();
        var hay = [
          item.full_name,
          item.phone,
          item.line_id,
          item.interested_plot,
          item.resolved_plot_code,
          item.note
        ].join(' ').toLowerCase();
        if (hay.indexOf(kw) === -1) return false;
      }
      return true;
    });
    return {
      items: filtered,
      filtered_count: filtered.length,
      summary: summary
    };
  }

  function localUpdateLeadStatus(id, payload) {
    var list = getOfflineLeads();
    var updated = null;
    for (var i = 0; i < list.length; i++) {
      if (Number(list[i].id) === Number(id)) {
        list[i] = Object.assign({}, list[i], payload);
        updated = list[i];
        break;
      }
    }
    if (!updated) throw new Error('ไม่พบข้อมูลลูกค้ารายนี้');
    try {
      window.localStorage.setItem(LOCAL_LEADS_CACHE_KEY, JSON.stringify(list));
    } catch (_) {}
    return updated;
  }

  async function createProperty(payload) {
    if (isFileProtocol) {
      return localCreateProperty(payload);
    }
    try {
      return await requestJson('/api/properties', { method: 'POST', body: payload });
    } catch (err) {
      if (err.status === 404) return localCreateProperty(payload);
      throw err;
    }
  }

  async function updateProperty(id, payload) {
    if (isFileProtocol) {
      return localUpdateProperty(id, payload);
    }
    try {
      return await requestJson('/api/properties/' + encodeURIComponent(id), { method: 'PUT', body: payload });
    } catch (err) {
      if (err.status === 404) return localUpdateProperty(id, payload);
      throw err;
    }
  }

  async function deleteProperty(id) {
    if (isFileProtocol) {
      return localDeleteProperty(id);
    }
    try {
      return await requestJson('/api/properties/' + encodeURIComponent(id), { method: 'DELETE' });
    } catch (err) {
      if (err.status === 404) return localDeleteProperty(id);
      throw err;
    }
  }

  async function getLeads(filters) {
    if (isFileProtocol) {
      return localGetLeads(filters);
    }
    try {
      var fOnline = filters || {};
      var params = new URLSearchParams();
      if (fOnline.status && fOnline.status !== 'all') params.set('status', fOnline.status);
      if (fOnline.search) params.set('search', fOnline.search);
      var qs = params.toString();
      return await requestJson('/api/leads' + (qs ? '?' + qs : ''));
    } catch (err) {
      if (err.status === 404) return localGetLeads(filters);
      throw err;
    }
  }

  async function updateLeadStatus(id, payload) {
    if (isFileProtocol) {
      return localUpdateLeadStatus(id, payload);
    }
    try {
      return await requestJson('/api/leads/' + encodeURIComponent(id) + '/status', {
        method: 'PUT',
        body: payload
      });
    } catch (err) {
      if (err.status === 404) return localUpdateLeadStatus(id, payload);
      throw err;
    }
  }

  window.ApiClient = {
    isFileProtocol: isFileProtocol,
    getBrand: getBrand,
    getProperties: getProperties,
    createLead: createLead,
    verifyAdmin: verifyAdmin,
    isAdminUnlocked: isAdminUnlocked,
    clearAdminSession: clearAdminSession,
    createProperty: createProperty,
    updateProperty: updateProperty,
    deleteProperty: deleteProperty,
    getLeads: getLeads,
    updateLeadStatus: updateLeadStatus
  };
})(window);

