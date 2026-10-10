/* Account previews never send, persist, or log personal details. */
(function () {
  'use strict';
  var form = document.querySelector('[data-account-preview]');
  if (form) {
    var result = document.querySelector('[data-account-result]');
    var error = document.querySelector('[data-account-error]');
    var mode = form.dataset.accountPreview;
    function showResult(title, copy, href, label) {
      result.replaceChildren();
      var heading = document.createElement('h2');
      heading.textContent = title;
      var paragraph = document.createElement('p');
      paragraph.textContent = copy;
      result.append(heading, paragraph);
      if (href) {
        var link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        result.append(link);
      }
      result.hidden = false;
      result.focus();
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      error.hidden = true;
      var confirm = form.querySelector('#account-confirm');
      var password = form.querySelector('#account-password');
      if (confirm && confirm.value !== password.value) {
        error.textContent = 'The passwords do not match. Please try again.';
        error.hidden = false;
        confirm.setAttribute('aria-invalid', 'true');
        confirm.setAttribute('aria-describedby', 'account-error');
        confirm.focus();
        return;
      }
      form.querySelectorAll('[aria-invalid]').forEach(function (input) { input.removeAttribute('aria-invalid'); });
      form.reset();
      form.querySelectorAll('[data-toggle-password]').forEach(function (button) {
        document.getElementById(button.dataset.togglePassword).type = 'password';
        button.textContent = 'Show';
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', 'Show ' + document.querySelector('label[for="' + button.dataset.togglePassword + '"]').textContent.toLowerCase());
      });
      if (mode === 'sign-in') showResult('Sign-in preview complete', 'In the live version, you would now be signed in. This preview has not created a session. Your sample details have been cleared.', '/roster/search/?saved=1', 'Browse your saved companies');
      if (mode === 'sign-up') showResult('Next step: verify your email', 'The live version would send a verification link. No account has been created and no email has been sent. Your sample details have been cleared.', '/roster/sign-in/', 'Preview sign in');
      if (mode === 'forgot-password') showResult('Reset email preview', 'The live version would email a secure reset link if an account exists. No email has been sent. You can preview the next screen below.', '/roster/reset-password/', 'Preview the new password screen');
      if (mode === 'reset-password') showResult('Password reset preview complete', 'This is the end of the recovery flow. No password has been changed and your sample details have been cleared.', '/roster/sign-in/', 'Back to sign in');
    });
    error.id = 'account-error';
    form.addEventListener('input', function (event) {
      event.target.removeAttribute('aria-invalid');
      error.hidden = true;
      result.hidden = true;
    });
    form.querySelectorAll('[data-toggle-password]').forEach(function (button) {
      button.addEventListener('click', function () {
        var input = document.getElementById(button.dataset.togglePassword);
        var visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        button.textContent = visible ? 'Hide' : 'Show';
        button.setAttribute('aria-pressed', String(visible));
        var label = document.querySelector('label[for="' + input.id + '"]').textContent.toLowerCase();
        button.setAttribute('aria-label', (visible ? 'Hide ' : 'Show ') + label);
      });
    });
    var google = form.querySelector('[data-google-preview]');
    if (google) google.addEventListener('click', function () {
      error.hidden = true;
      showResult('Google sign-in preview', 'The live version would open Google\'s secure account chooser. Google login is not connected in this beta, and no account information has been shared.');
    });
    // Enable only after the submit handler is attached. Dialog forms never navigate.
    form.querySelector('fieldset').disabled = false;
  }
  var reviews = document.querySelector('[data-profile-reviews]');
  if (reviews) {
    var search = reviews.querySelector('[data-review-search]');
    if (search) {
      var entries = Array.from(reviews.querySelectorAll('[data-review-entry]'));
      function filterReviews() {
        var query = search.value.trim().toLowerCase();
        var count = 0;
        entries.forEach(function (entry) {
          var show = entry.textContent.toLowerCase().includes(query);
          entry.hidden = !show;
          if (show) count++;
        });
        reviews.querySelector('[data-review-empty]').hidden = count > 0;
        reviews.querySelector('[data-review-count]').textContent = count + ' of ' + entries.length + ' review excerpts shown';
      }
      search.addEventListener('input', filterReviews);
      reviews.querySelector('[data-clear-reviews]').addEventListener('click', function () { search.value = ''; filterReviews(); search.focus(); });
    }
  }
  var tabs = Array.from(document.querySelectorAll('.company-section-nav a'));
  if (tabs.length) {
    function setTab(id) { tabs.forEach(function (tab) { var active = tab.hash === '#' + id; tab.classList.toggle('is-active', active); if (active) tab.setAttribute('aria-current', 'location'); else tab.removeAttribute('aria-current'); }); }
    setTab(location.hash.slice(1) || 'pricing');
    tabs.forEach(function (tab) { tab.addEventListener('click', function () { setTab(tab.hash.slice(1)); }); });
    window.addEventListener('hashchange', function () { setTab(location.hash.slice(1) || 'pricing'); });
  }
})();
