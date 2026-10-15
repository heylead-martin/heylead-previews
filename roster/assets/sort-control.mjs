// Enhance the native select without changing the directory's sorting contract.
export function setupSortControl(select) {
  const container = select.closest('.sort-control');
  const native = select.closest('label');
  const picker = document.createElement('div');
  picker.className = 'sort-picker';
  picker.innerHTML = `<button class="sort-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="sort-options"><span>Sort:</span><strong></strong><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="sort-menu" id="sort-options" role="menu" aria-label="Sort companies" hidden></div><a class="sort-info" href="/roster/how-it-works/" aria-label="How sorting works" title="How sorting works"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".7" fill="currentColor" stroke="none"/></svg></a>`;
  const trigger = picker.querySelector('.sort-trigger');
  const label = trigger.querySelector('strong');
  const menu = picker.querySelector('.sort-menu');
  const options = [...select.options].map(option => {
    const button = document.createElement('button');
    button.type = 'button'; button.role = 'menuitemradio'; button.tabIndex = -1;
    button.dataset.value = option.value;
    const text = document.createElement('span'); text.textContent = option.textContent;
    button.append(text);
    button.insertAdjacentHTML('beforeend','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>');
    button.addEventListener('click', () => {
      select.value = option.value;
      select.dispatchEvent(new Event('change', {bubbles:true}));
      sync(); close(true);
    });
    menu.append(button);
    return button;
  });
  let typed = '', typedAt = 0;
  function sync() {
    label.textContent = select.selectedOptions[0]?.textContent || '';
    trigger.setAttribute('aria-label', `Sort: ${label.textContent}`);
    options.forEach(button => button.setAttribute('aria-checked', String(button.dataset.value === select.value)));
  }
  function close(restoreFocus = false) {
    menu.hidden = true; trigger.setAttribute('aria-expanded','false'); typed = '';
    if(restoreFocus) trigger.focus();
  }
  function open(index = select.selectedIndex) {
    sync(); menu.hidden = false; trigger.setAttribute('aria-expanded','true');
    options[Math.max(0,index)]?.focus();
  }
  trigger.addEventListener('click', () => menu.hidden ? open() : close(true));
  trigger.addEventListener('keydown', event => {
    if(event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); open(event.key === 'ArrowUp' ? options.length - 1 : select.selectedIndex);
    }
  });
  menu.addEventListener('keydown', event => {
    const index = options.indexOf(document.activeElement);
    const key = event.key;
    if(key === 'Escape') {event.preventDefault(); close(true); return;}
    if(key === 'Tab') {
      // Put the trigger back in the tab sequence, then let the browser move on.
      close(true); return;
    }
    let target;
    if(key === 'ArrowDown') target = (index + 1) % options.length;
    if(key === 'ArrowUp') target = (index - 1 + options.length) % options.length;
    if(key === 'Home') target = 0;
    if(key === 'End') target = options.length - 1;
    if(target !== undefined) {event.preventDefault(); options[target].focus(); return;}
    if(key.length === 1 && key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      typed = Date.now() - typedAt > 700 ? key : typed + key; typedAt = Date.now();
      const match = options.find(button => button.textContent.toLowerCase().startsWith(typed.toLowerCase()));
      match?.focus();
    }
  });
  document.addEventListener('pointerdown', event => {if(!picker.contains(event.target)) close();});
  picker.addEventListener('focusout', event => {if(!picker.contains(event.relatedTarget)) close();});
  select.addEventListener('change', sync);
  container.append(picker); native.hidden = true; sync();
  return {sync};
}
