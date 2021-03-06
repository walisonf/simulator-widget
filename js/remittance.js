let remittanceRequestTimer;

function delayedGetRemittance(reverse, slide) {
  clearTimeout(remittanceRequestTimer);
  remittanceRequestTimer = setTimeout(() => {
    getRemittanceData(reverse, slide)
  }, 1)
}


/**
 * 
 ********************************************************************************************
 * 
*/


// ********* Remittance Simulation *********
async function getRemittanceData(reverse = true, slide = false) {
  _$('#remittance-action-btn').attr('disabled', true);
  let purposeCode = window.beneficiary.value;
  let remittanceType = window.remittanceType.value;
  let remittanceBRLValue = '';

  // Reverse route
  if (!reverse) {
    remittanceBRLValue = _$('input#remittance-result').val();
  } else {
    remittanceBRLValue = _$('input#remittance-value').val();
  }

  const currencyCode = window.remittance.value;

  _$('label#currency-symbol-remittance-value').html(currencyCode);
  const value = transformToInteger(remittanceBRLValue, 2);

  if (remittanceType === '') {
    remittanceType = undefined;
  }

  if (purposeCode === '') {
    purposeCode = undefined;
  }

  const { currency: {code, minValue, maxValue, offer, price, levelingRate}, tax: { iof, bankFee }, total, clamp } = await exchange.fetchRemittanceData(remittanceType, purposeCode, currencyCode, value, reverse);

  const minValueRemittance = minValue;
  const maxValueRemittance = maxValue;
  const currencyCodeRemittance = code;

  //-- Validate: Clamp method- min and max values for OUTBOUND and INBOUND.

  // Outbound: 
  if (remittanceType === 'outbound' && clamp === "MINIMUM") {
    _$('input#remittance-value').val(minValue);
    // alert("O valor mínimo de envio é de _$_$_$");
    M.toast({ html: 'O valor mínimo de envio é de ' + currencyCodeRemittance + ' ' + minValueRemittance });
  } else if (remittanceType === 'outbound' && clamp === "MAXIMUM") {
    _$('input#remittance-value').val(maxValue);
    M.toast({ html: 'O valor máximo de envio é de ' + currencyCodeRemittance + ' ' + maxValueRemittance });
  }

  // Inbound
  if (remittanceType === 'inbound' && clamp === "MINIMUM") {
    _$('input#remittance-value').val(minValue);
    M.toast({ html: 'O valor mínimo de recebimento é de ' + currencyCodeRemittance + ' ' + minValueRemittance });
  } else if (remittanceType === 'inbound' && clamp === "MAXIMUM") {
    _$('input#remittance-value').val(maxValue);
    M.toast({ html: 'O valor máximo de recebimento é de ' + currencyCodeRemittance + ' ' + maxValueRemittance });
  }


  if (slide) {
    // moeda estrangeira
    simulateRemittance(offer, iof, true);
    // real
    simulateRemittance(total.withTax, iof, false);
    // codigo bom
  } else {
    if (reverse) {
      simulateRemittance(offer, iof, reverse);
    } else {
      simulateRemittance(total.withTax, iof, reverse);
    }
  }


  // Fee infos for remittance 
  if (window.remittanceType.value === 'outbound') {
    populateQuotation(levelingRate.value / levelingRate.divisor);
  } else {
    populateQuotation(levelingRate.value / levelingRate.divisor);
  }

  populateVet(price.withTax.value / price.withTax.divisor);

  populateBankFeelBRL(bankFee.total.value / bankFee.total.divisor);
  

}

function populateQuotation(quoatation) {
  _$('span#priceWithoutTax').html(quoatation);
}

function populateVet(vet) {
  _$('span#priceWithTax').html(vet);
}

function populateBankFeelBRL(bankFee) {
  _$('span#bankFee').html(bankFee);
  console.log(bankFee);
}


function simulateRemittance(offer, iof, reverse) {
  if (!exchange) {
    return;
  }

  const convertedValue = (offer.value / offer.divisor);
  if (reverse) {
    _$('input#remittance-result').val(convertedValue.toFixed(2));
  } else {
    _$('input#remittance-value').val(convertedValue.toFixed(2));
  }

  const iofPercentage = iof.percentage;
  const iofValue = (iof.total.value / iof.total.divisor);

  _$('span#remittance-iof').html(iofPercentage);
  _$('span#remittance-with-iof').html(iofValue.toFixed(2));

  _$('#remittance-action-btn').removeAttr('disabled');
}


// Populate beneficiares and remittance types on select
function getBeneficiaries() {

  const remittanceOptions = [
    { label: 'Eu mesmo', value: 'IR001' },
    { label: 'Outra pessoa', value: 'IR002' }
  ];

  const remittanceType = [
    { label: 'Envio', value: 'outbound' },
    { label: 'Recebimento', value: 'inbound' }

  ];

  for (const option of remittanceOptions) {
    const result = _$(`<li class="mdc-list-item" data-value=${option.value} data-text=${option.label}></li>`)
      .html(option.label);

    _$('#remittance-beneficiary').append(result);
  }

  for (const option of remittanceType) {
    const result = _$(`<li class="mdc-list-item" data-value=${option.value} data-text=${option.label}></li>`)
      .html(option.label);

    _$('#remittance-type').append(result);
  }

  window.beneficiary.selectedIndex = '1';
  window.remittanceType.selectedIndex = '0';

  delayedGetRemittance();
}

// Populate currencies for Outbound type (USD, EUR)
function getOutboundCurrencies () {
  const remittanceCurrenciesOutbound = [
    { name: 'Dólar Americano', code: 'USD', image: "https://s3.amazonaws.com/frente-exchanges/flags/united-states.svg" },
    { name: 'Euro', code: 'EUR', image: "https://s3.amazonaws.com/frente-exchanges/flags/european-union.svg" }
  ];

  (_$('#remittance-currencies').children().remove());

  for (const currency of remittanceCurrenciesOutbound) {
    const remittanceCurrenciesOutbound = _$(
      `<li class="mdc-list-item" data-value=${currency.code} data-text=${currency.name.replace(/ /g, '')} data-icon=${currency.image}>
      </li>`
    )
      .html(` <img width="22px" src=${currency.image}></img> &nbsp; ${currency.name}`);

    _$('#remittance-currencies').append(remittanceCurrenciesOutbound);
  }

  window.remittance.selectedIndex = '0';
  delayedGetRemittance();
}

// Populate currencies for Inboud type (USD, EUR, GBP)
function getInboundCurrencies() {

  
  const remittanceCurrenciesInbound = [
    { name: 'Dólar Americano', code: 'USD', image: "https://s3.amazonaws.com/frente-exchanges/flags/united-states.svg" },
    { name: 'Euro', code: 'EUR', image: "https://s3.amazonaws.com/frente-exchanges/flags/european-union.svg" },
    { name: 'Libra Esterlina', code: 'GBP', image: "https://s3.amazonaws.com/frente-exchanges/flags/united-kingdom.svg"}
  ];

  (_$('#remittance-currencies').children().remove());

  for (const currency of remittanceCurrenciesInbound) {
      const remittanceCurrenciesInbound = _$(
      `<li class="mdc-list-item" data-value=${currency.code} data-text=${currency.name.replace(/ /g, '')} data-icon=${currency.image}>
      </li>`
    )
      .html(` <img width="22px" src=${currency.image}></img> &nbsp; ${currency.name}`);

    _$('#remittance-currencies').append(remittanceCurrenciesInbound);

  }

  delayedGetRemittance();
  window.remittance.selectedIndex = '0';
  
}