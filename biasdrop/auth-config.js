/* BiasDrop-only gate (separate from root previews.heylead.com login).
 * Password is hashed - plain value is not stored here.
 * Rotate: node -e "console.log(require('crypto').createHash('sha256').update('NEW','utf8').digest('hex'))"
 */
window.BIASDROP_AUTH = {
  siteName: "BiasDrop",
  passwordHash: "f6c7eee869457cf839dab7eea0df9d244c43d5fd2dce74c3b1452c90b16a7033",
  sessionKey: "biasdrop_preview_session_v1"
};
