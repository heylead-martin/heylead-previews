<?php
/* ARC site admin - tabbed editor for core-page text + brand copy. Writes content.json,
   which the website loads and overrides its text with. Password below is a sha256 hash. */

session_start();
header('X-Robots-Tag: noindex, nofollow');

const PASS_SHA256 = '1cbb75b13216f96bd8170c0eaf4b8de16565ea0673e668f0621bd7d22b20a32d';
$CONTENT_FILE = __DIR__ . '/content.json';

/* field defs: key => [label, control, suggested-length] */
$HERO_FIELDS = array(
    'heroEyebrow' => array('Hero - small top line', 'input', 40),
    'heroTitle1'  => array('Hero - headline line 1', 'input', 20),
    'heroTitle2'  => array('Hero - headline line 2 (gradient)', 'input', 24),
    'heroSub'     => array('Hero - subtitle', 'textarea', 130),
);
$CONTACT_FIELDS = array(
    'phone'    => array('Phone number (as displayed)', 'input', 16),
    'phoneTel' => array('Phone digits dialled on tap (e.g. 1800272476)', 'input', 12),
    'email'    => array('Contact email', 'input', 40),
);
$PAGE_FIELDS = array(
  'home' => array(
    'storyEyebrow' => array('"Our story" label', 'input', 30),
    'storyTitle'   => array('Story heading', 'input', 40),
    'storySub'     => array('Story paragraph', 'textarea', 120),
    'visionEyebrow'=> array('"Our vision" label', 'input', 30),
    'visionTitle'  => array('Vision heading', 'textarea', 70),
    'tEyebrow'     => array('Testimonials - small label', 'input', 30),
    'tTitle'       => array('Testimonials heading', 'input', 45),
  ),
  'services' => array(
    'eyebrow' => array('Small label', 'input', 30),
    'title'   => array('Heading', 'input', 48),
    'intro'   => array('Intro paragraph', 'textarea', 180),
  ),
  'about' => array(
    'eyebrow'      => array('Small label', 'input', 30),
    'title'        => array('Heading', 'input', 48),
    'intro'        => array('Intro paragraph', 'textarea', 210),
    'missionTitle' => array('Mission heading', 'input', 60),
    'missionP1'    => array('Mission paragraph 1', 'textarea', 220),
    'missionP2'    => array('Mission paragraph 2', 'textarea', 180),
  ),
  'contact' => array(
    'eyebrow' => array('Small label', 'input', 30),
    'title'   => array('Heading', 'input', 40),
    'intro'   => array('Intro paragraph', 'textarea', 150),
  ),
  'careers' => array(
    'title' => array('Heading', 'input', 48),
    'intro' => array('Intro paragraph', 'textarea', 200),
  ),
  'news' => array(
    'title' => array('Heading', 'input', 48),
    'intro' => array('Intro paragraph', 'textarea', 120),
  ),
  'blog' => array(
    'eyebrow' => array('Small label', 'input', 30),
    'title'   => array('Heading', 'input', 60),
  ),
);
$B_FIELDS = array(
    'name'      => array('Brand name', 'input', 22),
    'eyebrow'   => array('Category label (above the name)', 'input', 26),
    'tagline'   => array('Tagline', 'input', 45),
    'short'     => array('Card description (home + services grid)', 'textarea', 80),
    'blurb'     => array('Brand page - intro line', 'textarea', 110),
    'intro'     => array('Brand page - intro paragraph', 'textarea', 230),
    'bullets'   => array("\"What's included\" list (one bullet per line)", 'bullets', 0),
    'formIntro' => array('Quote form - intro line', 'textarea', 90),
    'messagePlaceholder' => array('Quote form - message box hint', 'textarea', 110),
);

function load_content($file) {
    $d = json_decode(@file_get_contents($file), true);
    if (!is_array($d)) $d = array();
    foreach (array('global','pages','brands') as $k) if (!isset($d[$k]) || !is_array($d[$k])) $d[$k] = array();
    if (empty($d['brandOrder'])) $d['brandOrder'] = array_keys($d['brands']);
    return $d;
}
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function clean($s) { return trim(strip_tags((string)$s)); }

if (isset($_GET['logout'])) { session_destroy(); header('Location: admin.php'); exit; }

$err = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['pw']) && empty($_SESSION['arc_ok'])) {
    sleep(1);
    if (hash_equals(PASS_SHA256, hash('sha256', (string)$_POST['pw']))) {
        $_SESSION['arc_ok'] = true;
        $_SESSION['arc_csrf'] = bin2hex(random_bytes(16));
        header('Location: admin.php'); exit;
    }
    $err = 'Wrong password.';
}
$authed = !empty($_SESSION['arc_ok']);

$saved = false; $saveErr = '';
if ($authed && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['save'])) {
    if (!hash_equals($_SESSION['arc_csrf'] ?? '', (string)($_POST['csrf'] ?? ''))) {
        $saveErr = 'Session expired - reload the page and try again.';
    } else {
        $data = load_content($CONTENT_FILE);
        foreach (array_merge($HERO_FIELDS, $CONTACT_FIELDS) as $k => $_)
            if (isset($_POST['g'][$k]) && is_string($_POST['g'][$k])) $data['global'][$k] = clean($_POST['g'][$k]);
        foreach ($PAGE_FIELDS as $pg => $fields) {
            foreach ($fields as $k => $_) {
                if (isset($_POST['p'][$pg][$k]) && is_string($_POST['p'][$pg][$k])) {
                    if (!isset($data['pages'][$pg]) || !is_array($data['pages'][$pg])) $data['pages'][$pg] = array();
                    $data['pages'][$pg][$k] = clean($_POST['p'][$pg][$k]);
                }
            }
        }
        if (isset($_POST['b']) && is_array($_POST['b'])) {
            foreach ($_POST['b'] as $bk => $fields) {
                if (!isset($data['brands'][$bk]) || !is_array($fields)) continue;
                foreach ($B_FIELDS as $k => $meta) {
                    if (!isset($fields[$k]) || !is_string($fields[$k])) continue;
                    if ($k === 'bullets') {
                        $lines = array_values(array_filter(array_map('clean', preg_split('/\r?\n/', $fields[$k]))));
                        $data['brands'][$bk][$k] = $lines;
                    } else {
                        $data['brands'][$bk][$k] = clean($fields[$k]);
                    }
                }
            }
        }
        $out = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if (@file_put_contents($CONTENT_FILE, $out . "\n", LOCK_EX) === false) $saveErr = 'Could not write content.json - check permissions.';
        else $saved = true;
    }
}

$data = load_content($CONTENT_FILE);

/* field renderer */
function field($name, $meta, $val) {
    echo '<label><span>' . h($meta[0]) . '</span>';
    if ($meta[1] === 'textarea') {
        echo '<textarea name="' . h($name) . '" data-rec="' . (int)$meta[2] . '">' . h($val) . '</textarea>';
    } elseif ($meta[1] === 'bullets') {
        $txt = is_array($val) ? implode("\n", $val) : (string)$val;
        echo '<textarea name="' . h($name) . '" class="bullets" rows="5" data-bul="1">' . h($txt) . '</textarea>';
    } else {
        echo '<input type="text" name="' . h($name) . '" value="' . h($val) . '" data-rec="' . (int)$meta[2] . '">';
    }
    echo '</label>';
}
$PAGE_LABELS = array('home'=>'Home','services'=>'Services','about'=>'About','contact'=>'Contact','careers'=>'Careers','news'=>'News','blog'=>'Blog','brands'=>'Brands');
?>
<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>ARC Site Admin</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,Arial,sans-serif;background:#06090f;color:#eaf1fb;margin:0;padding:28px 16px 80px;line-height:1.5}
  .wrap{max-width:820px;margin:0 auto}
  h1{font-size:22px;margin:0} .sub{color:#8fa1bb;font-size:14px;margin:2px 0 0}
  .top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:20px}
  a{color:#8fa1bb}
  .tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;position:sticky;top:0;background:#06090f;padding:8px 0;z-index:5}
  .tab{background:#0d1420;border:1px solid #1d2942;color:#aebed6;border-radius:999px;padding:8px 16px;font-size:13.5px;font-weight:700;cursor:pointer}
  .tab.on{background:#1f9e3c;border-color:#1f9e3c;color:#fff}
  .pane{display:none} .pane.on{display:block}
  .card{background:#0d1420;border:1px solid #1d2942;border-radius:14px;padding:22px;margin-bottom:16px}
  .card h2{font-size:13px;margin:0 0 14px;color:#2bcf72;text-transform:uppercase;letter-spacing:.08em}
  label{display:block;margin:0 0 14px} label span{display:block;font-size:12.5px;font-weight:600;color:#aebed6;margin-bottom:5px}
  input[type=text],input[type=password],textarea{width:100%;padding:10px 12px;border-radius:9px;border:1px solid #27354f;background:#0a0f18;color:#fff;font-size:14.5px;font-family:inherit}
  textarea{min-height:62px;resize:vertical} input:focus,textarea:focus{outline:none;border-color:#2bcf72}
  .cnt{font-size:11.5px;color:#5f7292;margin-top:4px}.cnt.warn{color:#e8b445}.cnt.over{color:#ff9b8a;font-weight:600}
  details{border:1px solid #1d2942;border-radius:14px;margin-bottom:12px;background:#0d1420}
  details summary{cursor:pointer;padding:15px 20px;font-weight:800;font-size:15px;list-style:none;display:flex;justify-content:space-between}
  details summary::after{content:'+';color:#2bcf72;font-size:18px}details[open] summary::after{content:'\2212'}
  details .inner{padding:2px 20px 16px}
  .btn{background:#1f9e3c;color:#fff;border:none;border-radius:999px;padding:13px 30px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
  .btn:hover{filter:brightness(1.1)}
  .savebar{position:fixed;left:0;right:0;bottom:0;background:#0a0f18;border-top:1px solid #1d2942;padding:14px;text-align:center;z-index:10}
  .msg{padding:12px 16px;border-radius:10px;margin-bottom:18px;font-size:14px;font-weight:600}
  .ok{background:rgba(43,207,114,.12);border:1px solid rgba(43,207,114,.45);color:#2bcf72}
  .bad{background:rgba(255,110,90,.1);border:1px solid rgba(255,110,90,.4);color:#ff9b8a}
  .hint{font-size:11.5px;color:#5f7292;margin-top:4px}
</style>
</head>
<body><div class="wrap">
<?php if (!$authed): ?>
  <div class="card" style="max-width:400px;margin:12vh auto 0">
    <h1>ARC Site Admin</h1><p class="sub">Enter the admin password to edit the website text.</p>
    <?php if ($err): ?><div class="msg bad" style="margin-top:16px"><?=h($err)?></div><?php endif; ?>
    <form method="post" style="margin-top:16px">
      <label><span>Password</span><input type="password" name="pw" autofocus autocomplete="current-password"></label>
      <button class="btn" type="submit">Log in</button>
    </form>
  </div>
<?php else: ?>
  <div class="top"><div><h1>ARC Site Admin</h1><p class="sub">Edit the text, hit Save - the live site updates immediately.</p></div><a href="admin.php?logout=1">Log out</a></div>
  <?php if ($saved): ?><div class="msg ok">Saved. The live site now shows the new text (refresh it to check).</div><?php endif; ?>
  <?php if ($saveErr): ?><div class="msg bad"><?=h($saveErr)?></div><?php endif; ?>

  <div class="tabs">
    <?php foreach ($PAGE_LABELS as $id => $lbl): ?><button type="button" class="tab" data-go="<?=$id?>"><?=$lbl?></button><?php endforeach; ?>
  </div>

  <form method="post">
    <input type="hidden" name="csrf" value="<?=h($_SESSION['arc_csrf'] ?? '')?>">

    <div class="pane" data-pane="home">
      <div class="card"><h2>Home - hero (top of page)</h2>
        <?php foreach ($HERO_FIELDS as $k => $m) field("g[$k]", $m, $data['global'][$k] ?? ''); ?>
      </div>
      <div class="card"><h2>Home - lower sections</h2>
        <?php foreach ($PAGE_FIELDS['home'] as $k => $m) field("p[home][$k]", $m, $data['pages']['home'][$k] ?? ''); ?>
      </div>
    </div>

    <?php foreach (array('services','about','careers','news','blog') as $pg): ?>
    <div class="pane" data-pane="<?=$pg?>">
      <div class="card"><h2><?=$PAGE_LABELS[$pg]?> page</h2>
        <?php foreach ($PAGE_FIELDS[$pg] as $k => $m) field("p[$pg][$k]", $m, $data['pages'][$pg][$k] ?? ''); ?>
      </div>
    </div>
    <?php endforeach; ?>

    <div class="pane" data-pane="contact">
      <div class="card"><h2>Contact page</h2>
        <?php foreach ($PAGE_FIELDS['contact'] as $k => $m) field("p[contact][$k]", $m, $data['pages']['contact'][$k] ?? ''); ?>
      </div>
      <div class="card"><h2>Site-wide contact details (header &amp; footer)</h2>
        <?php foreach ($CONTACT_FIELDS as $k => $m) field("g[$k]", $m, $data['global'][$k] ?? ''); ?>
      </div>
    </div>

    <div class="pane" data-pane="brands">
      <?php foreach ($data['brandOrder'] as $bk): if (!isset($data['brands'][$bk])) continue; $b = $data['brands'][$bk]; ?>
        <details>
          <summary><?=h($b['name'] ?? $bk)?> <small style="color:#8fa1bb;font-weight:400">&nbsp;<?=h($b['eyebrow'] ?? '')?></small></summary>
          <div class="inner">
          <?php foreach ($B_FIELDS as $k => $m) { field("b[$bk][$k]", $m, $b[$k] ?? ''); if ($k === 'bullets') echo '<p class="hint">One bullet per line - about 4 works best; keep each under ~55 characters.</p>'; } ?>
          </div>
        </details>
      <?php endforeach; ?>
    </div>

    <div class="savebar"><button class="btn" type="submit" name="save" value="1">Save all changes</button></div>
  </form>

  <script>
  var panes = document.querySelectorAll('.pane'), tabs = document.querySelectorAll('.tab');
  function go(id){
    panes.forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-pane')===id); });
    tabs.forEach(function(t){ t.classList.toggle('on', t.getAttribute('data-go')===id); });
    try{ localStorage.setItem('arcTab', id); }catch(e){}
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ go(t.getAttribute('data-go')); }); });
  var start = 'home'; try{ start = localStorage.getItem('arcTab') || 'home'; }catch(e){}
  if (!document.querySelector('[data-pane="'+start+'"]')) start = 'home';
  go(start);

  document.querySelectorAll('[data-rec]').forEach(function(el){
    var rec = parseInt(el.getAttribute('data-rec'), 10);
    var c = document.createElement('div'); c.className='cnt'; el.insertAdjacentElement('afterend', c);
    function upd(){ var n=el.value.length, over=n-rec;
      if(over>0){ c.className='cnt over'; c.textContent=n+' / '+rec+' suggested - '+over+' over (may wrap or crop)'; }
      else if(n>=Math.floor(rec*0.9)){ c.className='cnt warn'; c.textContent=n+' / '+rec+' suggested - '+(rec-n)+' left'; }
      else { c.className='cnt'; c.textContent=n+' / '+rec+' suggested'; } }
    el.addEventListener('input', upd); upd();
  });
  document.querySelectorAll('[data-bul]').forEach(function(el){
    var c=document.createElement('div'); c.className='cnt'; el.insertAdjacentElement('afterend', c);
    function upd(){ var lines=el.value.split('\n').filter(function(s){return s.trim();}); c.textContent=lines.length+' bullet'+(lines.length===1?'':'s'); }
    el.addEventListener('input', upd); upd();
  });
  </script>
<?php endif; ?>
</div></body></html>
