// A local UI preview only. No requests, browser storage or contact-detail logging.
(() => {
  const form = document.querySelector('[data-claim-preview]');
  if (!form) return;
  const company = form.querySelector('#claim-company');
  const result = document.querySelector('[data-claim-result]');
  const slug = new URLSearchParams(location.search).get('company');
  if ([...company.options].some(option => option.value === slug)) company.value = slug;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const selected = company.value;
    result.querySelector('[data-claim-business]').textContent = 'Business selected: ' + company.selectedOptions[0].textContent;
    form.reset();
    company.value = selected;
    form.hidden = true;
    result.hidden = false;
    result.focus();
  });
  document.querySelector('[data-claim-again]').addEventListener('click', () => {
    result.hidden = true;
    form.hidden = false;
    company.focus();
  });
  form.querySelector('fieldset').disabled = false;
})();
