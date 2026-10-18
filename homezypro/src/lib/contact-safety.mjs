// Site-side safety net for contact data (QA 18 Oct 2026, P1-2 and P1-3).
// 1. Obvious placeholder phone/WhatsApp numbers (template values such as +65 9123 4567 or
//    +65 1234 5678, sequential or repeated digits, or anything that is not a valid Singapore
//    8-digit number starting 3, 6, 8 or 9) are never published.
// 2. A registered (ACRA) address is not premises, so its town is never used as the card location.
export const OTHER_LOCATIONS = 'Other Singapore locations';

const SEQUENCES = ['0123456789', '9876543210'];
export function isPlaceholderPhone(value) {
  let d = String(value || '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('65')) d = d.slice(2);
  if (d.length !== 8 || !/^[3689]/.test(d)) return true;
  if (/^(\d)\1{7}$/.test(d)) return true;                       // 88888888
  if (/^\d(\d)\1{6}$/.test(d)) return true;                     // 98888888
  const tail = d.slice(1);
  if (SEQUENCES.some(s => s.includes(d) || s.includes(tail))) return true; // 91234567, 98765432
  return false;
}

export const isRegisteredAddress = address => !!address && (address.kind === 'registered' || address.registeredAddress === true);

// Mutates and returns the company; `log` receives one line per change.
export function applyContactSafety(company, log = () => {}) {
  if (company.whatsapp?.value && isPlaceholderPhone(company.whatsapp.value)) {
    log(`${company.slug}: placeholder WhatsApp ${company.whatsapp.value} hidden`);
    delete company.whatsapp;
  }
  if (Array.isArray(company.alternatePhones)) {
    const kept = company.alternatePhones.filter(p => !isPlaceholderPhone(p?.value));
    if (kept.length !== company.alternatePhones.length) log(`${company.slug}: placeholder alternate phone hidden`);
    company.alternatePhones = kept;
  }
  if (company.phone?.value && isPlaceholderPhone(company.phone.value)) {
    const alt = company.alternatePhones?.[0] || (company.whatsapp?.value && {value: company.whatsapp.value, sourceUrl: company.whatsapp.sourceUrl});
    log(`${company.slug}: placeholder phone ${company.phone.value} ${alt ? 'replaced by a sourced alternate' : 'withheld; listing not published'}`);
    if (alt) { company.phone = {value: alt.value, sourceUrl: alt.sourceUrl}; company.alternatePhones = (company.alternatePhones || []).filter(p => p.value !== alt.value); }
    else company.publish = false;
  }
  if (isRegisteredAddress(company.address) && company.area && company.area !== OTHER_LOCATIONS) {
    log(`${company.slug}: registered-address town ${company.area} not used as card location`);
    company.area = OTHER_LOCATIONS;
  }
  return company;
}

// Every +65 number in a chunk of text/HTML that looks like a placeholder.
export function placeholderNumbersIn(text) {
  return [...String(text).matchAll(/(?:\+65[\s-]?|wa\.me\/\+?65|tel:\+?65)(\d{4})[\s-]?(\d{4})\b/g)]
    .map(m => m[1] + m[2]).filter(n => isPlaceholderPhone(n));
}
