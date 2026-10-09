(function () {
  var boxes = document.querySelectorAll(".ask");
  boxes.forEach(function (box) {
    var button = box.querySelector("button");
    if (!button) return;
    button.addEventListener("click", function () {
      var note = box.querySelector("[data-result]");
      if (note) {
        note.hidden = false;
        note.textContent = "Beta: this request was not sent.";
      }
    });
  });

  /* On narrow screens the job nav scrolls sideways. Keep the current job in view. */
  var nav = document.querySelector(".nav");
  var current = nav && nav.querySelector("[aria-current]");
  if (nav && current && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
  }
})();
