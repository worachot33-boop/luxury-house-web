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
        name: (state.brand && state.brand.name) || 'HAVEN LUXE ESTATE',
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

  var currentActiveHeroProperty = null;

  function syncHeroVillaData(properties) {
    var stage = document.getElementById('heroGrandStage');
    if (!stage || !Array.isArray(properties) || properties.length === 0) return;

    var pills = stage.querySelectorAll('.hero-villa-pill');
    pills.forEach(function (pill) {
      var plotCode = (pill.getAttribute('data-plot') || '').toUpperCase();
      var villaId = Number(pill.getAttribute('data-villa-id'));
      var match = null;

      for (var i = 0; i < properties.length; i++) {
        var p = properties[i];
        if ((villaId && Number(p.id) === villaId) || (plotCode && String(p.plot_code).toUpperCase() === plotCode)) {
          match = p;
          break;
        }
      }

      if (match) {
        var mil = (Number(match.price_thb) / 1000000).toFixed(1).replace(/\.0$/, '');
        var builtinMil = ((Number(match.builtin_value_thb) || 0) / 1000000).toFixed(1).replace(/\.0$/, '');
        var shortTitle = match.title.split('—')[0].trim();
        pill.innerHTML = '<span class="pill-dot"></span> ' + window.PropertyCatalog.escapeHtml(shortTitle) + ' (' + mil + ' ลบ.)';
        pill.setAttribute('data-villa-title', match.title + (match.builtin_style ? ' • สไตล์ ' + match.builtin_style : ''));
        pill.setAttribute(
          'data-villa-desc',
          'แปลง ' + match.plot_code + ' • ' + match.usable_area_sqm + ' ตร.ม. • ' + match.bedrooms + ' ห้องนอน ' + match.bathrooms + ' ห้องน้ำ • ' + match.subtitle
        );
        pill.setAttribute('data-villa-price', (Number(match.price_thb) / 1000000).toFixed(2).replace(/\.00$/, '') + ' ล้านบาท');
        pill.setAttribute('data-villa-builtin', '✦ ฟรีบิ้วอิน ' + builtinMil + ' ล้าน');
        pill.setAttribute('data-villa-id', String(match.id));
      }
    });

    var activePill = stage.querySelector('.hero-villa-pill.active') || pills[0];
    if (activePill) {
      updateHeroShowcaseFromPill(activePill, properties);
    }
  }

  function updateHeroShowcaseFromPill(pill, properties) {
    if (!pill) return;
    var heroImg = document.getElementById('heroCinematicImg');
    var badgeEl = document.getElementById('heroCapsuleBadge');
    var titleEl = document.getElementById('heroCapsuleTitle');
    var descEl = document.getElementById('heroCapsuleDesc');
    var priceEl = document.getElementById('heroCapsulePrice');
    var builtinEl = document.getElementById('heroCapsuleBuiltin');

    var newSrc = pill.getAttribute('data-villa-img');
    var newTitle = pill.getAttribute('data-villa-title');
    var newDesc = pill.getAttribute('data-villa-desc');
    var newPrice = pill.getAttribute('data-villa-price');
    var newBuiltin = pill.getAttribute('data-villa-builtin');
    var villaId = Number(pill.getAttribute('data-villa-id'));
    var plotCode = (pill.getAttribute('data-plot') || '').toUpperCase();

    var propList = Array.isArray(properties) && properties.length > 0 ? properties : state.allProperties;
    currentActiveHeroProperty = null;
    for (var i = 0; i < propList.length; i++) {
      var p = propList[i];
      if ((villaId && Number(p.id) === villaId) || (plotCode && String(p.plot_code).toUpperCase() === plotCode)) {
        currentActiveHeroProperty = p;
        break;
      }
    }

    if (heroImg && newSrc) {
      heroImg.style.opacity = '0.4';
      setTimeout(function () {
        heroImg.src = newSrc;
        heroImg.alt = 'HAVEN LUXE ESTATE ' + (newTitle || 'บ้านเดี่ยวหรู');
        heroImg.style.opacity = '1';
      }, 100);
    }

    if (badgeEl) badgeEl.textContent = '✦ SIGNATURE VILLA';
    if (titleEl && newTitle) titleEl.textContent = newTitle;
    if (descEl && newDesc) descEl.textContent = newDesc;
    if (priceEl && newPrice) priceEl.textContent = newPrice;
    if (builtinEl && newBuiltin) builtinEl.textContent = newBuiltin;
  }

  function initHeroVillaSwitcher() {
    var stage = document.getElementById('heroGrandStage');
    if (!stage) return;

    var pills = stage.querySelectorAll('.hero-villa-pill');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        pills.forEach(function (p) {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
        updateHeroShowcaseFromPill(pill, state.allProperties);
      });
    });

    var viewSpecsBtn = document.getElementById('heroViewSpecsBtn');
    if (viewSpecsBtn) {
      viewSpecsBtn.addEventListener('click', function () {
        var target = currentActiveHeroProperty;
        if (!target && state.allProperties.length > 0) {
          target = state.allProperties[0];
        }
        if (target && window.PropertyCatalog && typeof window.PropertyCatalog.openDetailModal === 'function') {
          window.PropertyCatalog.openDetailModal(target, buildCatalogCallbacks());
        } else {
          var catalogSec = document.getElementById('catalogSection');
          if (catalogSec) catalogSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    var calcUnitBtn = document.getElementById('heroCalcUnitBtn');
    if (calcUnitBtn) {
      calcUnitBtn.addEventListener('click', function () {
        var target = currentActiveHeroProperty;
        if (!target && state.allProperties.length > 0) {
          target = state.allProperties[0];
        }
        if (target && window.MortgageCalculator && typeof window.MortgageCalculator.selectPropertyForCalc === 'function') {
          window.MortgageCalculator.selectPropertyForCalc(target);
        } else {
          var calcSec = document.getElementById('calculatorSection');
          if (calcSec) calcSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    var searchBtn = document.getElementById('headerSearchBtn');
    var searchInput = document.getElementById('filterSearchInput');
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById('catalogSection');
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(function () {
            searchInput.focus();
          }, 380);
        }
      });
    }
  }

  function initGalleryLightbox() {
    var modal = document.getElementById('galleryLightboxModal');
    var modalImg = document.getElementById('galleryLightboxImg');
    var closeBtn = document.getElementById('closeGalleryLightboxBtn');
    var grid = document.getElementById('luxuryGalleryGrid');

    if (!modal || !modalImg || !grid) return;

    function openLightbox(src, alt) {
      modalImg.src = src;
      modalImg.alt = alt || 'ภาพขยายผลงานบิ้วอินหรู';
      modal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      modal.setAttribute('hidden', '');
      modalImg.src = '';
      document.body.style.overflow = '';
    }

    grid.addEventListener('click', function (e) {
      var card = e.target.closest('.gallery-card');
      if (!card) return;
      var img = card.querySelector('img');
      if (img && img.src) {
        openLightbox(img.src, img.alt);
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeLightbox();
      });
    }

    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.classList.contains('modal-backdrop') || e.target.closest('.modal-dialog') === null) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
        closeLightbox();
      }
    });
  }

  async function refreshCatalog() {
    var fullRes = await window.ApiClient.getProperties({});
    state.allProperties = fullRes.items || [];
    state.isOfflineFallback = Boolean(fullRes.isOfflineFallback);
    updateModeBanner();
    updateDynamicSeo(state.allProperties);

    syncHeroVillaData(state.allProperties);
    window.MortgageCalculator.populateUnitSelector(state.allProperties);
    window.LeadManager.populateBookingPropertyDropdown(state.allProperties);
    await applyFiltersAndRender();
  }

  async function initApp() {
    bindNavigationAndAdminHook();
    initHeroVillaSwitcher();
    window.PropertyCatalog.initCompareSlider();
    window.PropertyCatalog.bindModalEvents();
    initGalleryLightbox();
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

    syncHeroVillaData(state.allProperties);
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

