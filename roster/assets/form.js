(function () {
  var boxes = document.querySelectorAll("[data-quote-steps]");

  function trimValue(box, name) {
    var input = box.querySelector('[name="' + name + '"]');
    return input ? input.value.trim() : "";
  }

  boxes.forEach(function (box) {
    var steps = box.querySelectorAll("[data-step]");
    var progress = box.querySelector("[data-progress]");
    var error = box.querySelector("[data-error]");
    var result = box.querySelector("[data-result]");
    var current = 1;
    var total = steps.length;

    function selectedValue(name) {
      var selected = box.querySelector('[name="' + name + '"]:checked');
      return selected ? selected.value : "";
    }

    function clearError() {
      if (!error) return;
      error.hidden = true;
      error.textContent = "";
    }

    function clearGroupInvalid(name) {
      box.querySelectorAll('[name="' + name + '"]').forEach(function (field) {
        field.removeAttribute("aria-invalid");
      });
    }

    function showError(message, field) {
      if (error) {
        error.textContent = message;
        error.hidden = false;
        error.focus();
      }
      if (field) {
        field.setAttribute("aria-invalid", "true");
        field.focus();
      }
    }

    function showStep(number) {
      current = number;
      steps.forEach(function (step) {
        step.hidden = Number(step.getAttribute("data-step")) !== current;
      });
      if (progress) progress.textContent = "Step " + current + " of " + total;
      clearError();
    }

    function updateRecipients() {
      var count = Number(selectedValue("company-count")) || 1;
      var copy = box.querySelector("[data-recipient-copy]");
      var recipients = box.querySelectorAll("[data-recipient-index]");
      if (copy) {
        copy.textContent = count === 1
          ? "1 company will contact you."
          : "These " + count + " companies will contact you.";
      }
      recipients.forEach(function (recipient) {
        recipient.hidden = Number(recipient.getAttribute("data-recipient-index")) > count;
      });
    }

    function requiredField(name, message) {
      var field = box.querySelector('[name="' + name + '"]');
      if (field && trimValue(box, name)) {
        field.removeAttribute("aria-invalid");
        return true;
      }
      showError(message, field);
      return false;
    }

    function validateStep(number) {
      if (number === 1) {
        if (!requiredField("job", "Select the job before continuing.")) return false;
        if (!requiredField("property", "Select the property type before continuing.")) return false;
        var size = box.querySelector('[name="size"]');
        if (size && Number(trimValue(box, "size")) > 0) {
          size.removeAttribute("aria-invalid");
          return true;
        }
        showError("Enter the number of units or rooms as a number above zero.", size);
        return false;
      }
      if (number === 2) {
        var postal = box.querySelector('[name="postal"]');
        if (postal && /^\d{6}$/.test(trimValue(box, "postal"))) {
          postal.removeAttribute("aria-invalid");
          return true;
        }
        showError("Enter a six-digit Singapore postal code.", postal);
        return false;
      }
      if (number === 3) {
        if (selectedValue("when")) {
          clearGroupInvalid("when");
          return true;
        }
        showError("Choose when you need the job.", box.querySelector('[name="when"]'));
        return false;
      }
      if (number === 4) {
        if (selectedValue("company-count")) {
          clearGroupInvalid("company-count");
          return true;
        }
        showError("Choose how many companies should contact you.", box.querySelector('[name="company-count"]'));
        return false;
      }
      if (number === 5) {
        var mobile = trimValue(box, "mobile");
        var email = trimValue(box, "email");
        var mobileField = box.querySelector('[name="mobile"]');
        var emailField = box.querySelector('[name="email"]');
        if (!requiredField("name", "Enter your name before continuing.")) return false;
        if (!/^[89]\d{7}$/.test(mobile)) {
          showError("Enter an 8-digit Singapore mobile number starting with 8 or 9.", mobileField);
          return false;
        }
        if (mobileField) mobileField.removeAttribute("aria-invalid");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showError("Enter a valid email address.", emailField);
          return false;
        }
        if (emailField) emailField.removeAttribute("aria-invalid");
        return true;
      }
      return true;
    }

    box.querySelectorAll("[data-next]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (validateStep(current)) showStep(Math.min(current + 1, total));
      });
    });

    box.querySelectorAll("[data-back]").forEach(function (button) {
      button.addEventListener("click", function () {
        showStep(Math.max(current - 1, 1));
      });
    });

    box.querySelectorAll('[name="company-count"]').forEach(function (input) {
      input.addEventListener("change", updateRecipients);
    });

    box.querySelectorAll("input, select").forEach(function (input) {
      input.addEventListener("input", function () {
        input.removeAttribute("aria-invalid");
      });
      input.addEventListener("change", function () {
        input.removeAttribute("aria-invalid");
      });
    });

    var submit = box.querySelector("[data-submit]");
    if (submit) {
      submit.addEventListener("click", function () {
        if (!validateStep(5)) return;
        clearError();
        if (result) {
          result.hidden = false;
          result.textContent = "Beta: this request was not sent.";
        }
      });
    }

    updateRecipients();
    showStep(1);
  });

  /* On narrow screens the job nav scrolls sideways. Keep the current job in view. */
  var nav = document.querySelector(".nav");
  var current = nav && nav.querySelector("[aria-current]");
  if (nav && current && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
  }
})();
