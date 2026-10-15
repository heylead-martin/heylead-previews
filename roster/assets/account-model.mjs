export const GUEST_KEY = 'roster-saved';
export const validSlug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 180;
export const normalizeSaved = values => [...new Set((Array.isArray(values) ? values : []).filter(validSlug))].slice(0, 1000);

export function safeNext(value, origin) {
  try {
    const url = new URL(value || '/roster/saved/', origin);
    if (url.origin !== origin || !url.pathname.startsWith('/roster/') ||
      /[\\\\]/.test(value || '') || /%2f|%5c/i.test(url.pathname) ||
      /^\/roster\/(?:auth|sign-in|sign-up|forgot-password|reset-password)(?:\/|$)/.test(url.pathname)) return '/roster/saved/';
    return url.pathname + url.search + url.hash;
  } catch { return '/roster/saved/'; }
}

export function validateAccountConfig(config) {
  if (!config?.url && !config?.publishableKey) return false;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url || '')) throw new Error('Use the HTTPS Supabase project URL, with no path or trailing slash.');
  const key = config.publishableKey || '';
  if (key.startsWith('sb_publishable_') && key.length > 25) return true;
  try {
    const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.role === 'anon' && key.split('.').length === 3) return true;
  } catch {}
  throw new Error('Use a public publishable or anon key. Secret and service-role keys must never reach the browser.');
}

// Signed-in saves stay in memory. Only guest company slugs use browser storage.
export function createSavedStore({storage, remote, changed = () => {}}) {
  let epoch = 0, userId = null, list = [], loading = false, error = '';
  const pending = new Set();
  const guests = () => {
    try { return normalizeSaved(JSON.parse(storage.getItem(GUEST_KEY) || '[]')); } catch { return []; }
  };
  list = guests();
  const state = () => ({userId, saved:[...list], loading, error, pending:[...pending], guestCount:guests().length});
  const emit = () => changed(state());
  async function refresh() {
    const version = epoch, owner = userId;
    if (pending.size) return;
    if (!owner) { list = guests(); emit(); return; }
    loading = true; error = ''; emit();
    try {
      const rows = await remote.list(owner);
      if (version === epoch) list = normalizeSaved(rows);
    } catch {
      if (version === epoch) error = 'Your saved companies could not be loaded. Try again.';
    } finally {
      if (version === epoch) { loading = false; emit(); }
    }
  }
  async function setUser(id) {
    if (id === userId) return;
    ++epoch; userId = id; pending.clear(); error = '';
    list = id ? [] : guests(); loading = !!id; emit();
    await refresh();
  }
  async function toggle(slug) {
    if (!validSlug(slug) || loading || pending.has(slug)) return false;
    const version = epoch, owner = userId, existed = list.includes(slug);
    if (!existed && list.length >= 1000) throw new Error('Your saved list is full. Remove a company first.');
    list = existed ? list.filter(x => x !== slug) : [...list, slug];
    pending.add(slug); error = ''; emit();
    try {
      if (owner) await (existed ? remote.remove(owner, slug) : remote.add(owner, [slug]));
      else storage.setItem(GUEST_KEY, JSON.stringify(list));
      return true;
    } catch {
      if (version === epoch) {
        list = existed ? normalizeSaved([...list, slug]) : list.filter(x => x !== slug);
        error = owner ? 'That change could not be saved. Please try again.' : 'Your browser could not save this company. Check your storage settings.';
      }
      throw new Error(error || 'Your account changed. Please try again.');
    } finally {
      if (version === epoch) { pending.delete(slug); emit(); }
    }
  }
  async function importGuests() {
    if (!userId || loading || pending.size) return;
    const owner = userId, version = epoch, items = guests();
    if (!items.length) return;
    loading = true; error = ''; emit();
    try {
      await remote.add(owner, items);
      if (version !== epoch) return;
      // Remove only the imported snapshot, retaining guest saves from another tab.
      storage.setItem(GUEST_KEY, JSON.stringify(guests().filter(x => !items.includes(x))));
    } catch {
      if (version === epoch) error = 'Browser saves could not be imported. They are still on this device.';
    } finally {
      if (version === epoch) { loading = false; emit(); }
    }
    if (version === epoch && !error) await refresh();
  }
  return {state, refresh, setUser, toggle, importGuests};
}
