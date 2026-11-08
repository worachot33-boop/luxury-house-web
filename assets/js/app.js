(function (window) {
  'use strict';

  var state = {
    brand: (window.InitialHouseData && window.InitialHouseData.BRAND) || {},
    allProperties: [],
    filteredProperties: [],
    isOfflineFallback: false,
    filters: {
      search: '',
      budgetBand: 'all',
      status: 'all',
      bedrooms: 'all',
      sort: 'price_asc'
    }
  };

  var searchDebounceTimer = null;

  function budgetBandToRange(band) {
    if (band === '8-12') return { minPrice: 8000000, maxPrice: 12000000 };
    if (band === '12-16') return { minPrice: 12000000, maxPrice: 16000000 };
    if (band === '16-20') return { minPrice: 16000000, maxPrice: 20000000 };
    return { minPrice: '', maxPrice: '' };
  }

  function buildCatalogCallbacks() {
    return {
      onResetFilters: resetFilters,
      onSelectForMortgage: function (prop) {
        window.MortgageCalculator.selectPropertyForCalc(prop);
      },
      onSelectForBooking: function (prop) {
        window.LeadManager.prefillBookingForProperty(prop, '');
      }
    };
  }

  async function applyFiltersAndRender() {
    var range = budgetBandToRange(state.filters.budgetBand);
    try {
      var res = await window.ApiClient.getProperties({
        search: state.filters.search,
        minPrice: range.minPrice,
        maxPrice: range.maxPrice,
        status: state.filters.status,
        bedrooms: state.filters.bedrooms,
        sort: state.filters.sort
      });

      state.filteredProperties = res.items || [];
      state.isOfflineFallback = Boolean(res.isOfflineFallback);
      updateModeBanner();
      window.PropertyCatalog.renderCatalog(state.filteredProperties, buildCatalogCallbacks());
    } catch (err) {
      var gridEl = document.getElementById('propertyGrid');
      if (gridEl) {
        gridEl.innerHTML =
          '<div class="empty-catalog-box" style="grid-column: 1 / -1;">' +
          '<p style="color:var(--danger-text);margin:0;">' +
          window.PropertyCatalog.escapeHtml(err.message || 'ไม่สามารถดึงรายการบ้านได้') +
          '</p></div>';
      }
    }
  }

  function resetFilters() {
    state.filters = {
      search: '',
      budgetBand: 'all',
      status: 'all',
      bedrooms: 'all',
      sort: 'price_asc'
    };

    var searchEl = document.getElementById('filterSearchInput');
    var budgetEl = document.getElementById('filterBudgetSelect');
    var statusEl = document.getElementById('filterStatusSelect');
    var bedEl = document.getElementById('filterBedroomsSelect');
    var sortEl = document.getElementById('filterSortSelect');

    if (searchEl) searchEl.value = '';
    if (budgetEl) budgetEl.value = 'all';
    if (statusEl) statusEl.value = 'all';
    if (bedEl) bedEl.value = 'all';
    if (sortEl) sortEl.value = 'price_asc';

    applyFiltersAndRender();
  }

  function bindFilterControls() {
    var searchEl = document.getElementById('filterSearchInput');
    var budgetEl = document.getElementById('filterBudgetSelect');
    var statusEl = document.getElementById('filterStatusSelect');
    var bedEl = document.getElementById('filterBedroomsSelect');
    var sortEl = document.getElementById('filterSortSelect');
    var resetBtn = document.getElementById('resetFiltersBtn');

    if (searchEl) {
      searchEl.addEventListener('input', function () {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(function () {
          state.filters.search = searchEl.value.trim();
          applyFiltersAndRender();
        }, 220);
      });
    }

    if (budgetEl) {
      budgetEl.addEventListener('change', function () {
        state.filters.budgetBand = budgetEl.value;
        applyFiltersAndRender();
      });
    }

    if (statusEl) {
      statusEl.addEventListener('change', function () {
        state.filters.status = statusEl.value;
        applyFiltersAndRender();
      });
    }

    if (bedEl) {
      bedEl.addEventListener('change', function () {
        state.filters.bedrooms = bedEl.value;
        applyFiltersAndRender();
      });
    }

    if (sortEl) {
      sortEl.addEventListener('change', function () {
        state.filters.sort = sortEl.value;
        applyFiltersAndRender();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetFilters);
    }
  }

  function bindNavigationAndAdminHook() {
    var menuBtn = document.getElementById('mobileMenuBtn');
    var nav = document.getElementById('mainNav');
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      nav.querySelectorAll('a, button').forEach(function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }

    function openAdminDashboard() {
      if (window.AdminCms && typeof window.AdminCms.openDashboard === 'function') {
        window.AdminCms.openDashboard();
      } else {
        window.alert('ระบบจัดการหลังบ้าน (Admin CMS) กำลังโหลด กรุณารอสักครู่ครับ');
      }
    }

    var adminBtn = document.getElementById('openAdminCmsBtn');
    if (adminBtn) {
      adminBtn.addEventListener('click', openAdminDashboard);
    }

    var mobileAdminBtn = document.getElementById('mobileAdminCmsBtn');
    if (mobileAdminBtn) {
      mobileAdminBtn.addEventListener('click', openAdminDashboard);
    }
  }

  function updateModeBanner() {
    var banner = document.getElementById('standaloneModeBanner');
    if (!banner) return;
    banner.hidden = !state.isOfflineFallback;
  }

  function updateDynamicSeo(properties) {
    var list = Array.isArray(properties) && properties.length > 0 ? properties : [];
    if (list.length === 0) return;

    var prices = list.map(function (p) { return Number(p.price_thb) || 0; }).filter(function (v) { return v > 0; });
    if (prices.length === 0) return;

    var minP = Math.min.apply(null, prices);
    var maxP = Math.max.apply(null, prices);
    var minMil = (minP / 1000000).toFixed(1).replace(/\.0$/, '');
    var maxMil = (maxP / 1000000).toFixed(1).replace(/\.0$/, '');

    var jsonLdEl = document.getElementById('dynamicJsonLd');
    if (jsonLdEl) {
      var schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: (state.brand && state.brand.name) || 'THE AURELIA RESIDENCE',
        description: 'โครงการบ้านเดี่ยวหรู ตกแต่งบิ้วอินครบพร้อมเข้าอยู่ ราคา ' + minMil + ' – ' + maxMil + ' ล้านบาท ทำเลวัชรพล – ด่านจตุโชติ',
        telephone: (state.brand && state.brand.phone) || '02-889-9900',
        priceRange: 'THB ' + minP.toLocaleString('en-US') + ' - ' + maxP.toLocaleString('en-US'),
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'วัชรพล - จตุโชติ',
          addressRegion: 'กรุงเทพมหานคร',
          addressCountry: 'TH'
        },
        makesOffer: list.map(function (p) {
          return {
            '@type': 'Offer',
            name: 'แปลง ' + p.plot_code + ' - ' + p.title,
            price: p.price_thb,
            priceCurrency: 'THB',
            availability: p.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut'
          };
        })
      };
      jsonLdEl.textContent = JSON.stringify(schemaObj, null, 2);
    }
  }

  async function refreshCatalog() {
    var fullRes = await window.ApiClient.getProperties({});
    state.allProperties = fullRes.items || [];
    state.isOfflineFallback = Boolean(fullRes.isOfflineFallback);
    updateModeBanner();
    updateDynamicSeo(state.allProperties);

    window.MortgageCalculator.populateUnitSelector(state.allProperties);
    window.LeadManager.populateBookingPropertyDropdown(state.allProperties);
    await applyFiltersAndRender();
  }

  async function initApp() {
    bindNavigationAndAdminHook();
    window.PropertyCatalog.initCompareSlider();
    window.PropertyCatalog.bindModalEvents();
    bindFilterControls();
    window.LeadManager.initBookingForm();

    var brandRes = await window.ApiClient.getBrand();
    state.brand = brandRes.brand || state.brand;
    state.isOfflineFallback = Boolean(brandRes.isOfflineFallback);
    updateModeBanner();
    window.LeadManager.bindLineButtons(state.brand);

    var fullRes = await window.ApiClient.getProperties({});
    state.allProperties = fullRes.items || [];
    state.filteredProperties = state.allProperties.slice();
    updateDynamicSeo(state.allProperties);

    window.PropertyCatalog.renderCatalog(state.filteredProperties, buildCatalogCallbacks());
    window.MortgageCalculator.init(state.allProperties, {
      onBookWithCalcContext: function (prop, monthlyText) {
        window.LeadManager.prefillBookingForProperty(prop, monthlyText);
      }
    });
    window.LeadManager.populateBookingPropertyDropdown(state.allProperties);
  }

  document.addEventListener('DOMContentLoaded', initApp);

  window.LuxuryHouseApp = {
    getState: function () { return state; },
    refreshCatalog: refreshCatalog,
    resetFilters: resetFilters
  };
})(window);

