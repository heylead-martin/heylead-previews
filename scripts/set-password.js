#!/usr/bin/env node
/**
 * Rotate the previews.heylead.com gate password.
 *
 * Usage:
 *   node scripts/set-password.js 'YourNewPassword'
 *
 * Then:
 *   git add auth-config.js
 *   git commit -m "chore: rotate previews password"
 *   git push
 *
 * No "forgot password" email exists - this IS how you reset.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: node scripts/set-password.js \'YourNewPassword\'  (min 8 chars)');
  process.exit(1);
}

const email = 'martin@heylead.com';
const hash = crypto.createHash('sha256').update(password, 'utf8').digest('hex');
const root = path.join(__dirname, '..');

const authConfig = `/* Auto-generated - do not put the plain password in this file.
 * Change password: node scripts/set-password.js 'YourNewPassword'
 */
window.PREVIEWS_AUTH = {
  email: ${JSON.stringify(email)},
  passwordHash: ${JSON.stringify(hash)},
  sessionKey: 'heylead_previews_session_v1'
};
`;

fs.writeFileSync(path.join(root, 'auth-config.js'), authConfig);
fs.writeFileSync(path.join(root, '.password-local.txt'),
`PREVIEWS.HEYLEAD.COM LOGIN (gitignored - do not commit)
Email: ${email}
Password: ${password}
Updated: ${new Date().toISOString()}

Rotate again anytime:
  node scripts/set-password.js 'AnotherPassword'
  git add auth-config.js && git commit -m "chore: rotate previews password" && git push
`);

console.log('OK - password updated for', email);
console.log('Hash written to auth-config.js');
console.log('Plain password saved ONLY to .password-local.txt (gitignored)');
console.log('');
console.log('Next:');
console.log('  git add auth-config.js');
console.log('  git commit -m "chore: rotate previews password"');
console.log('  git push');
