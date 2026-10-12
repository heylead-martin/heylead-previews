import {getSupabaseClient, loadAccountConfig} from './supabase-client.mjs';
import {createSavedStore, GUEST_KEY, safeNext} from './account-model.mjs';
import {decodeCatalogue} from './catalogue-data.mjs';
import {renderCompactCard} from './catalogue-card.mjs';

let config = {configured:false, googleEnabled:false};
const form = document.querySelector('[data-account-form]');
const mode = form?.dataset.accountForm;
const savedPage = document.querySelector('[data-saved-page]');
const accountPage = document.querySelector('[data-account-home]');
const callback = document.querySelector('[data-account-callback]');
const next = safeNext(new URLSearchParams(location.search).get('next'), location.origin);
const NEXT_KEY = 'roster-auth-next';
const storage = {getItem:key => localStorage.getItem(key), setItem:(key,value) => localStorage.setItem(key,value)};
let client, user = null, status = 'loading', recoveryAllowed = false, busy = false, authVersion = 0, catalogue, noticeTimer;
let initError = '', catalogueError = '';
const store = createSavedStore({
  storage,
  remote: {
    async list(owner) {
      const {data,error} = await client.from('roster_saved_companies').select('company_slug').eq('user_id',owner).order('created_at',{ascending:false}).limit(1000);
      if(error) throw error;
      return data.map(row => row.company_slug);
    },
    async add(owner,slugs) {
      const {error} = await client.from('roster_saved_companies').upsert(slugs.map(company_slug=>({user_id:owner,company_slug})),{onConflict:'user_id,company_slug',ignoreDuplicates:true});
      if(error) throw error;
    },
    async remove(owner,slug) {
      const {error} = await client.from('roster_saved_companies').delete().eq('user_id',owner).eq('company_slug',slug);
      if(error) throw error;
    }
  },
  changed: () => render()
});
const snapshot = () => ({...store.state(),status,user,configured:config.configured});
window.RosterAccount = {snapshot, ready:null};

function notice(message, failure = false) {
  let node = document.querySelector('[data-save-notice]');
  if(!node) {
    node = document.createElement('div'); node.dataset.saveNotice = '';
    node.className = 'save-notice'; node.setAttribute('role','status'); document.body.append(node);
  }
  node.textContent = message; node.classList.toggle('is-error',failure); node.hidden = false;
  clearTimeout(noticeTimer); noticeTimer = setTimeout(()=>node.hidden=true,6000);
}
function renderSaveButtons() {
  const state = store.state();
  document.querySelectorAll('[data-save]').forEach(button=>{
    const active = state.saved.includes(button.dataset.save);
    button.setAttribute('aria-pressed',String(active));
    const name = button.closest('[data-company]')?.dataset.name || document.querySelector('h1')?.textContent || 'company';
    button.setAttribute('aria-label',(active?'Unsave ':'Save ')+name.trim());
    button.disabled = status==='loading' || status==='error' || state.loading || state.pending.includes(button.dataset.save);
    const label = button.querySelector('[data-save-label]'); if(label) label.textContent=active?'Saved':'Save';
  });
}
function render() {
  const state = snapshot();
  document.querySelectorAll('[data-account-guest]').forEach(el=>el.hidden=status==='user');
  document.querySelectorAll('[data-account-member]').forEach(el=>el.hidden=status!=='user');
  document.querySelectorAll('[data-saved-count]').forEach(el=>{el.textContent=state.saved.length;el.hidden=!state.saved.length||status==='loading'||status==='error';});
  document.querySelectorAll('[data-account-email]').forEach(el=>el.textContent=user?.email||'');
  document.querySelectorAll('[data-account-name]').forEach(el=>el.textContent=user?.user_metadata?.full_name||user?.user_metadata?.name||'Your account');
  if(accountPage) {
    accountPage.querySelector('[data-member-panel]').hidden=status!=='user';
    accountPage.querySelector('[data-account-prompt]').hidden=status==='user';
    accountPage.querySelector('[data-account-prompt-text]').textContent=status==='loading'?'Checking your account...':status==='error'?initError:'Sign in to keep your saved companies together across devices.';
  }
  if(savedPage) renderSavedPage(state);
  window.dispatchEvent(new Event('roster-saved-change'));
  renderSaveButtons();
}
function renderSavedPage(state) {
  const message=savedPage.querySelector('[data-saved-status]'), list=savedPage.querySelector('[data-saved-list]');
  const loading=status==='loading'||state.loading;
  savedPage.querySelector('[data-import-guests]').hidden=status!=='user'||!state.guestCount;
  savedPage.querySelector('[data-import-guests]').disabled=loading||state.pending.length>0;
  savedPage.querySelector('[data-import-count]').textContent=state.guestCount;
  savedPage.querySelector('[data-save-signin]').hidden=status==='user'||status==='loading';
  savedPage.querySelector('[data-saved-retry]').hidden=!(state.error||initError||catalogueError);
  message.textContent=initError||catalogueError||state.error||(loading?'Loading your saved companies...':status==='user'?'Saved to your account. Pick up where you left off on any device.':'Saved in this browser. Sign in to keep your favourites across devices.');
  savedPage.querySelector('[data-saved-total]').textContent=state.saved.length;
  if(!catalogue||loading||status==='error') {list.replaceChildren();savedPage.querySelector('[data-saved-empty]').hidden=true;return;}
  const bySlug=new Map(catalogue.map(row=>[row.slug,row]));
  list.innerHTML=state.saved.map(slug=>bySlug.has(slug)?renderCompactCard(bySlug.get(slug),true):'').join('');
  // Retired listings remain removable instead of disappearing from the account count.
  for(const slug of state.saved.filter(slug=>!bySlug.has(slug))) {
    const li=document.createElement('li');li.className='saved-unavailable';
    const p=document.createElement('p');p.textContent='This company is no longer listed on Roster.';
    const button=document.createElement('button');button.type='button';button.dataset.save=slug;button.className='btn';button.textContent='Remove from saved';
    li.append(p,button);list.append(li);
  }
  savedPage.querySelector('[data-saved-empty]').hidden=state.saved.length>0;
}
function showError(message) {
  const node=document.querySelector('[data-account-error]');
  if(node) {node.textContent=message;node.hidden=false;node.focus();}
  else notice(message,true);
}
function result(title, copy, href, label) {
  const node=document.querySelector('[data-account-result]');
  if(!node) return;
  const h=document.createElement('h2');h.textContent=title;
  const p=document.createElement('p');p.textContent=copy;
  node.replaceChildren(h,p);
  if(href) {const a=document.createElement('a');a.href=href;a.textContent=label;node.append(a);}
  node.hidden=false;node.focus();
}
function setBusy(value) {
  busy=value;
  if(form) {
    form.querySelector('fieldset').disabled=value||!config.configured||status==='error'||(mode==='reset-password'&&!recoveryAllowed);
    form.setAttribute('aria-busy',String(value));
    const google=form.querySelector('[data-google-signin]');if(google) google.disabled=!config.googleEnabled||value;
  }
}
function clearPasswords() {
  form?.querySelectorAll('input[type=password], [data-password-input]').forEach(el=>{el.value='';el.type='password';});
  form?.querySelectorAll('[data-toggle-password]').forEach(button=>{button.textContent='Show';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Show password');});
}
function friendly(error) {
  const code=error?.code||'';
  if(code==='invalid_credentials') return 'The email or password is incorrect. Please try again.';
  if(code==='email_not_confirmed') return 'Please verify your email first. You can resend the confirmation below.';
  if(/rate_limit|over_email_send/.test(code)||error?.status===429) return 'Too many attempts. Please wait a few minutes and try again.';
  if(/weak_password|same_password/.test(code)) return 'Choose a different password with at least 12 characters.';
  return 'We could not complete that request. Please try again.';
}
async function acceptUser(newUser) {
  user=newUser;status=user?'user':'guest';initError='';
  await store.setUser(user?.id||null);
  render();
}
async function initialise() {
  const params=new URLSearchParams(location.search);
  const code=params.get('code');
  const providerError=params.has('error');
  // Strip callback credentials even if loading configuration fails.
  if(callback||mode==='reset-password') history.replaceState(null,'',location.pathname);
  try {
    config=await loadAccountConfig();
    if(!config.configured) {
      status='guest';render();
      document.querySelectorAll('[data-account-setup]').forEach(el=>el.hidden=false);
      setBusy(false);return;
    }
    client=getSupabaseClient(config);
    let finishing=false;
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY') recoveryAllowed=true;
      // Never await other SDK calls while inside its auth lock.
      if(finishing||event==='INITIAL_SESSION') return;
      const version=++authVersion;
      setTimeout(async()=>{
        if(version!==authVersion) return;
        if(event==='SIGNED_OUT') {recoveryAllowed=false;await acceptUser(null);}
        else if(session?.user&&user?.id!==session.user.id) {
          const {data,error}=await client.auth.getUser();
          if(version===authVersion&&!error) await acceptUser(data.user);
        }
      },0);
    });
    if(callback||mode==='reset-password') {
      if(providerError) throw new Error('Sign-in was cancelled or the link expired. Please try again.');
      if(!code||code.length>4000) throw new Error(mode==='reset-password'?'Open the reset link from your email to set a new password.':'This sign-in link is missing or has expired. Please sign in again.');
      finishing=true;
      const {data,error}=await client.auth.exchangeCodeForSession(code);
      finishing=false;
      if(error) throw new Error('This link has expired or was opened in another browser. Request a new link here and open it in the same browser.');
      recoveryAllowed=data.redirectType==='recovery';
      if(mode==='reset-password'&&!recoveryAllowed) throw new Error('Please request a password reset link to continue.');
    }
    const {data:sessionData,error:sessionError}=await client.auth.getSession();
    if(sessionError) throw new Error('Your session could not be restored. Please sign in again.');
    if(sessionData.session) {
      const {data,error}=await client.auth.getUser();
      if(error) throw new Error('Your account could not be checked. Check your connection and try again.');
      await acceptUser(data.user);
    } else await acceptUser(null);
    if(callback) {
      let target='/roster/saved/';
      try {target=safeNext(sessionStorage.getItem(NEXT_KEY),location.origin);sessionStorage.removeItem(NEXT_KEY);} catch {}
      location.replace(recoveryAllowed?'/roster/reset-password/':target);
      return;
    }
    if(user&&(mode==='sign-in'||mode==='sign-up')) {
      result('You are signed in.','Your saved companies are ready.',next,'Continue to Roster');
      form.hidden=true;
    }
  } catch(error) {
    status='error';initError=error.message||'Accounts could not be loaded. Please try again.';render();showError(initError);
    if(callback) result('Let us try that again.',initError,'/roster/sign-in/','Back to sign in');
  }
  setBusy(false);
}

if(form) {
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy||!config.configured||status==='error') return;
    const errorNode=document.querySelector('[data-account-error]');errorNode.hidden=true;
    const email=form.querySelector('#account-email')?.value.trim();
    const password=form.querySelector('#account-password')?.value;
    if(mode==='reset-password'&&(!recoveryAllowed||form.querySelector('#account-confirm').value!==password)) {showError('The passwords do not match, or your reset link has expired.');return;}
    setBusy(true);
    try {
      if(mode==='sign-in') {
        const {data,error}=await client.auth.signInWithPassword({email,password});
        if(error) throw error;
        await acceptUser(data.user);clearPasswords();location.assign(next);return;
      }
      if(mode==='sign-up') {
        const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name:form.querySelector('#account-name').value.trim()},emailRedirectTo:location.origin+'/roster/auth/callback/'}});
        if(error) throw error;
        clearPasswords();
        if(data.session) {await acceptUser(data.user);location.assign(next);return;}
        result('Check your email.','If this address can be registered, you will receive a verification link. Open it in this browser. Already registered? Sign in or reset your password.','/roster/sign-in/','Back to sign in');
      }
      if(mode==='forgot-password') {
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/roster/reset-password/'});
        if(error) throw error;
        result('Check your inbox.','If an account exists for this email, we will send a password reset link. Open it in this browser.','/roster/sign-in/','Back to sign in');
      }
      if(mode==='reset-password') {
        const {error}=await client.auth.updateUser({password});
        if(error) throw error;
        clearPasswords();recoveryAllowed=false;
        const signedOut=await client.auth.signOut({scope:'global'});
        if(signedOut.error) {
          form.hidden=true;result('Password updated.','Your password changed. Please use Sign out below to finish ending your session.','/roster/account/','Go to your account');
        } else {
          await acceptUser(null);form.hidden=true;result('Password updated.','Sign in again with your new password.','/roster/sign-in/','Sign in');
        }
      }
    } catch(error) {showError(friendly(error));clearPasswords();}
    finally {setBusy(false);}
  });
  form.querySelectorAll('[data-toggle-password]').forEach(button=>button.addEventListener('click',()=>{
    const input=document.getElementById(button.dataset.togglePassword),show=input.type==='password';
    input.type=show?'text':'password';button.textContent=show?'Hide':'Show';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',show?'Hide password':'Show password');
  }));
  form.querySelector('[data-google-signin]')?.addEventListener('click',async()=>{
    if(busy||!client||!config.googleEnabled) return;
    setBusy(true);
    try {
      sessionStorage.setItem(NEXT_KEY,next);
      const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/roster/auth/callback/',queryParams:{prompt:'select_account'}}});
      if(error) throw error;
    } catch(error) {showError(friendly(error));setBusy(false);}
  });
  form.querySelector('[data-resend-confirmation]')?.addEventListener('click',async()=>{
    const email=form.querySelector('#account-email');
    if(!email.reportValidity()||busy||!client) return;
    setBusy(true);
    try {
      const {error}=await client.auth.resend({type:'signup',email:email.value.trim(),options:{emailRedirectTo:location.origin+'/roster/auth/callback/'}});
      if(error) throw error;
      result('Check your inbox.','If this account needs verification, a new confirmation email is on its way.');
    } catch(error) {showError(friendly(error));} finally {setBusy(false);}
  });
}
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-save]');
  if(!button) return;
  await window.RosterAccount.ready;
  if(status==='error') {notice(initError,true);return;}
  const wasSaved=store.state().saved.includes(button.dataset.save);
  try {
    if(await store.toggle(button.dataset.save)) notice(wasSaved?'Removed from saved companies.':user?'Saved to your account.':'Saved in this browser. Sign in to sync across devices.');
  } catch(error) {notice(error.message,true);}
});
document.querySelectorAll('[data-sign-out]').forEach(button=>button.addEventListener('click',async()=>{
  if(!client) return;
  button.disabled=true;
  const {error}=await client.auth.signOut({scope:button.dataset.signOut==='all'?'global':'local'});
  button.disabled=false;
  if(error) {notice('We could not sign you out. Please check your connection and try again.',true);return;}
  await acceptUser(null);location.assign('/roster/sign-in/');
}));
savedPage?.querySelector('[data-import-guests]').addEventListener('click',()=>store.importGuests());
savedPage?.querySelector('[data-saved-retry]').addEventListener('click',()=>status==='error'||catalogueError?location.reload():store.refresh());
window.addEventListener('storage',event=>{if(event.key===GUEST_KEY) {if(!user) void store.refresh();else render();}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&status==='user') void store.refresh();});
window.addEventListener('roster-cards-rendered',renderSaveButtons);
window.RosterAccount.ready=initialise();
if(savedPage) {
  fetch(savedPage.dataset.index,{credentials:'same-origin'}).then(async response=>{
    if(!response.ok) throw new Error();
    catalogue=decodeCatalogue(await response.json());render();
  }).catch(()=>{
    catalogueError='Company details could not be loaded. Please try again.';
    render();
  });
}
