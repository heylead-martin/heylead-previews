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
})();
