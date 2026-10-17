// Format validation only. This beta cannot check whether a number has WhatsApp.
export function validWhatsAppNumber(value) {
 const text=String(value).trim();
 if(!/^[+\d\s().-]+$/.test(text))return false;
 const compact=text.replace(/[\s().-]/g,'');
 if(/^[89]\d{7}$/.test(compact))return true;
 if(compact.startsWith('+65'))return /^\+65[89]\d{7}$/.test(compact);
 return /^\+[1-9]\d{6,14}$/.test(compact);
}
