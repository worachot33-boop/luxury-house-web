(function (window) {
  'use strict';

  var currentSelectedProperty = null;
  var unitProperties = [];

  function calculateLoan(params) {
    var p = params || {};
    var priceThb = Math.max(0, Number(p.priceThb) || 0);
    var downPercent = Math.min(80, Math.max(0, Number(p.downPercent) || 0));
    var annualRate = Math.min(25, Math.max(0, Number(p.annualRate) || 0));
    var years = Math.min(40, Math.max(1, Math.round(Number(p.years) || 30)));

    var downAmount = Math.round(priceThb * (downPercent / 100));
    var principal = Math.max(0, priceThb - downAmount);
    var months = years * 12;

    var monthlyPayment = 0;
    if (principal > 0 && months > 0) {
      if (annualRate === 0) {
        monthlyPayment = Math.round(principal / months);
      } else {
        var r = annualRate / 100 / 12;
        var factor = Math.pow(1 + r, months);
        monthlyPayment = Math.round((principal * (r * factor)) / (factor - 1));
      }
    }

    var recommendedIncome = monthlyPayment > 0 ? Math.ceil(monthlyPayment / 0.45 / 1000) * 1000 : 0;

    return {
      priceThb: priceThb,
      downPercent: downPercent,
      downAmount: downAmount,
      principal: principal,
      annualRate: annualRate,
      years: years,
      monthlyPayment: monthlyPayment,
      recommendedIncome: recommendedIncome
    };
  }

  function formatNumber(n) {
    return Math.round(Number(n) || 0).toLocaleString('th-TH');
  }

  function populateUnitSelector(properties) {
    var selectEl = document.getElementById('calcUnitSelect');
    unitProperties = Array.isArray(properties) ? properties.slice() : [];
    if (!selectEl) return;

    var list = unitProperties;
    var optionsHtml = '<option value="custom">-- กำหนดราคาบ้านด้วยตนเอง --</option>';
    list.forEach(function (prop) {
      var million = (Number(prop.price_thb) / 1000000).toFixed(2).replace(/\.00$/, '');
      optionsHtml +=
        '<option value="' + Number(prop.id) + '" data-price="' + Number(prop.price_thb) + '">' +
        'แปลง ' + window.PropertyCatalog.escapeHtml(prop.plot_code) + ' — ' +
        window.PropertyCatalog.escapeHtml(prop.title) + ' (' + million + ' ล้าน)' +
        '</option>';
    });
    selectEl.innerHTML = optionsHtml;

    var priceInput = document.getElementById('calcPriceInput');
    if (currentSelectedProperty) {
      var matched = null;
      for (var i = 0; i < list.length; i++) {
        if (Number(list[i].id) === Number(currentSelectedProperty.id)) {
          matched = list[i];
          break;
        }
      }
      if (matched) {
        currentSelectedProperty = matched;
        selectEl.value = String(matched.id);
        if (priceInput) priceInput.value = String(matched.price_thb);
        recalculateAndRender();
        return;
      }
      currentSelectedProperty = null;
    }

    if (list.length > 0 && !currentSelectedProperty) {
      currentSelectedProperty = list[0];
      selectEl.value = String(list[0].id);
      if (priceInput) priceInput.value = String(list[0].price_thb);
      recalculateAndRender();
    }
  }

  function recalculateAndRender() {
    var priceInput = document.getElementById('calcPriceInput');
    var downRange = document.getElementById('calcDownRange');
    var rateInput = document.getElementById('calcRateInput');
    var yearsRange = document.getElementById('calcYearsRange');

    if (!priceInput || !downRange || !rateInput || !yearsRange) return;

    var res = calculateLoan({
      priceThb: Number(priceInput.value),
      downPercent: Number(downRange.value),
      annualRate: Number(rateInput.value),
      years: Number(yearsRange.value)
    });

    var downLabel = document.getElementById('calcDownPercentLabel');
    var yearsLabel = document.getElementById('calcYearsLabel');
    var monthlyEl = document.getElementById('calcMonthlyResult');
    var principalEl = document.getElementById('calcPrincipalResult');
    var downAmtEl = document.getElementById('calcDownAmountResult');
    var incomeEl = document.getElementById('calcIncomeResult');

    if (downLabel) downLabel.textContent = res.downPercent + '% (' + formatNumber(res.downAmount) + ' บาท)';
    if (yearsLabel) yearsLabel.textContent = res.years + ' ปี (' + (res.years * 12) + ' งวด)';
    if (monthlyEl) monthlyEl.textContent = formatNumber(res.monthlyPayment) + ' บาท/เดือน';
    if (principalEl) principalEl.textContent = formatNumber(res.principal) + ' บาท';
    if (downAmtEl) downAmtEl.textContent = formatNumber(res.downAmount) + ' บาท';
    if (incomeEl) incomeEl.textContent = 'ประมาณ ' + formatNumber(res.recommendedIncome) + ' บาท/เดือน';
  }

  function selectPropertyForCalc(property) {
    if (!property) return;
    currentSelectedProperty = property;

    var selectEl = document.getElementById('calcUnitSelect');
    var priceInput = document.getElementById('calcPriceInput');
    if (selectEl) selectEl.value = String(property.id);
    if (priceInput) priceInput.value = String(property.price_thb);

    recalculateAndRender();

    var section = document.getElementById('calculatorSection');
    if (section && typeof section.scrollIntoView === 'function') {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function init(properties, callbacks) {
    populateUnitSelector(properties);

    var selectEl = document.getElementById('calcUnitSelect');
    var priceInput = document.getElementById('calcPriceInput');
    var downRange = document.getElementById('calcDownRange');
    var rateInput = document.getElementById('calcRateInput');
    var yearsRange = document.getElementById('calcYearsRange');
    var bookFromCalcBtn = document.getElementById('calcToBookingBtn');

    if (selectEl) {
      selectEl.addEventListener('change', function () {
        var val = selectEl.value;
        if (val === 'custom') {
          currentSelectedProperty = null;
          return;
        }
        for (var i = 0; i < unitProperties.length; i++) {
          if (String(unitProperties[i].id) === val) {
            currentSelectedProperty = unitProperties[i];
            if (priceInput) priceInput.value = String(unitProperties[i].price_thb);
            break;
          }
        }
        recalculateAndRender();
      });
    }

    if (priceInput) {
      priceInput.addEventListener('input', function () {
        if (selectEl) selectEl.value = 'custom';
        currentSelectedProperty = null;
        recalculateAndRender();
      });
    }

    if (downRange) downRange.addEventListener('input', recalculateAndRender);
    if (yearsRange) yearsRange.addEventListener('input', recalculateAndRender);
    if (rateInput) {
      rateInput.addEventListener('input', function () {
        var typedRate = Number(rateInput.value);
        document.querySelectorAll('.preset-chip[data-rate]').forEach(function (c) {
          c.classList.toggle('active', Number(c.getAttribute('data-rate')) === typedRate);
        });
        recalculateAndRender();
      });
    }

    document.querySelectorAll('.preset-chip[data-rate]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.preset-chip[data-rate]').forEach(function (c) {
          c.classList.remove('active');
        });
        chip.classList.add('active');
        if (rateInput) {
          rateInput.value = chip.getAttribute('data-rate');
          recalculateAndRender();
        }
      });
    });

    if (bookFromCalcBtn) {
      bookFromCalcBtn.addEventListener('click', function () {
        if (callbacks && typeof callbacks.onBookWithCalcContext === 'function') {
          var monthlyEl = document.getElementById('calcMonthlyResult');
          callbacks.onBookWithCalcContext(
            currentSelectedProperty,
            monthlyEl ? monthlyEl.textContent : ''
          );
        }
      });
    }

    recalculateAndRender();
  }

  window.MortgageCalculator = {
    calculateLoan: calculateLoan,
    init: init,
    populateUnitSelector: populateUnitSelector,
    selectPropertyForCalc: selectPropertyForCalc,
    recalculateAndRender: recalculateAndRender
  };
})(window);

