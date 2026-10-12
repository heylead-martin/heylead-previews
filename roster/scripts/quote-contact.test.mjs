import test from 'node:test';
import assert from 'node:assert/strict';
import {validWhatsAppNumber} from '../assets/quote-contact.mjs';

test('Contact preview accepts formatted Singapore mobile numbers and international numbers',()=>{
 for(const value of ['8123 4567','+65 9123 4567','+65 (8123) 4567','+44 7700 900123'])assert.equal(validWhatsAppNumber(value),true,value);
});
test('Contact preview rejects incomplete, fixed-line Singapore and malformed numbers',()=>{
 for(const value of ['', '123','6123 4567','+65 6123 4567','+65 8123 456','++65 8123 4567','call me at +65 8123 4567','+001234567','+1234567890123456'])assert.equal(validWhatsAppNumber(value),false,value);
});
