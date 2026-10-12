const hero = document.querySelector('[data-profession-hero]');
if (hero) {
  const photos = [...hero.querySelectorAll('[data-profession-photo]')];
  const words = [...hero.querySelectorAll('[data-profession-word]')];
  const buttons = [...hero.querySelectorAll('[data-profession]')];
  const pause = hero.querySelector('[data-profession-pause]');
  const browse = hero.querySelector('[data-profession-browse]');
  const live = hero.querySelector('[data-profession-live]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let paused = motion.matches;
  let visible = true;
  let timer;
  let request = 0;
  const loads = new Map();
  const unavailable = new Set();

  function loadPhoto(index) {
    if (!loads.has(index)) {
      const photo = photos[index];
      if (photo.dataset.src) {
        photo.srcset = photo.dataset.srcset;
        photo.src = photo.dataset.src;
      }
      loads.set(index, (async () => {
        try {
          await photo.decode();
        } catch {
          // A responsive source change can cancel decode without an image failure.
          try { await photo.decode(); } catch { /* Check the displayed image below. */ }
        }
        const ready = photo.complete && photo.naturalWidth > 0;
        if (ready) unavailable.delete(index);
        else {
          unavailable.add(index);
          loads.delete(index);
        }
        return ready;
      })());
    }
    return loads.get(index);
  }

  function nextPhoto() {
    for (let step = 1; step < photos.length; step++) {
      const candidate = (active + step) % photos.length;
      if (!unavailable.has(candidate)) return candidate;
    }
    return active;
  }

  function stopTimer() {
    window.clearTimeout(timer);
    hero.dataset.rotating = 'false';
  }

  function schedule() {
    stopTimer();
    const focus = document.activeElement;
    const interacting = hero.contains(focus) && focus !== pause;
    if (paused || motion.matches || document.hidden || !visible || interacting || nextPhoto() === active) return;
    hero.dataset.rotating = 'true';
    timer = window.setTimeout(() => show(nextPhoto()), 7000);
  }

  function updatePause() {
    pause.hidden = motion.matches;
    pause.classList.toggle('is-paused', paused);
    const label = paused ? 'Resume image rotation' : 'Pause image rotation';
    pause.setAttribute('aria-label', label);
    pause.title = label;
  }

  async function show(index, manual = false) {
    const version = ++request;
    stopTimer();
    if (manual) {
      paused = true;
      updatePause();
    }
    const ready = await loadPhoto(index);
    if (version !== request) return;
    if (!ready) {
      if (manual) live.textContent = 'This photo is unavailable. Choose another profession.';
      schedule();
      return;
    }
    // A pending image must not resume a slide change while someone types.
    if (!manual && (paused || motion.matches || document.hidden || !visible ||
      (hero.contains(document.activeElement) && document.activeElement !== pause))) return;
    active = index;
    photos.forEach((photo, i) => photo.classList.toggle('is-active', i === active));
    words.forEach((word, i) => word.classList.toggle('is-active', i === active));
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === active)));
    browse.href = buttons[active].dataset.professionUrl;
    if (manual) live.textContent = `Showing ${buttons[active].textContent.trim()}. Image rotation paused.`;
    schedule();
    if (!motion.matches) void loadPhoto(nextPhoto());
  }

  buttons.forEach((button, index) => {
    button.disabled = false;
    button.addEventListener('click', () => show(index, true));
  });
  pause.addEventListener('click', () => {
    paused = !paused;
    ++request;
    updatePause();
    schedule();
  });
  hero.addEventListener('focusin', schedule);
  hero.addEventListener('focusout', () => window.setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    paused = true;
    ++request;
    updatePause();
    schedule();
  });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }, {threshold: 0.2});
  observer.observe(hero);
  updatePause();
  void loadPhoto(0).then(() => {
    schedule();
    if (!motion.matches) void loadPhoto(nextPhoto());
  });
}
