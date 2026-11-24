<?php
// شريط الإعلانات: الإعدادات تُخزَّن كـ JSON في مفتاح announce_config (توقيت ليبيا UTC+2)

function announce_default(): array {
    return ['enabled' => true, 'messages' => [], 'interval' => 5, 'bg' => '#000000', 'color' => '#ffffff',
        'start' => '', 'end' => '', 'countdown' => false, 'closable' => false, 'effect' => 'fade'];
}

function announce_effects(): array {
    return ['fade' => 'تلاشي (الحالي)', 'slide' => 'انزلاق جانبي ناعم', 'vertical' => 'انزلاق عمودي', 'marquee' => 'شريط متحرك مستمر (Ticker)'];
}

function announce_sanitize($raw): array {
    $r = is_array($raw) ? $raw : [];
    $messages = [];
    foreach (array_slice(is_array($r['messages'] ?? null) ? $r['messages'] : [], 0, 10) as $m) {
        if (!is_array($m)) continue;
        $text = trim(mb_substr((string)($m['text'] ?? ''), 0, 200));
        $link = trim(mb_substr((string)($m['link'] ?? ''), 0, 500));
        if ($link !== '' && !(strpos($link, '/') === 0 && strpos($link, '//') !== 0) && !preg_match('#^https?://#i', $link)) $link = '';
        if ($text !== '') $messages[] = ['text' => $text, 'link' => $link];
    }
    $hex = '/^#[0-9a-fA-F]{6}$/';
    $date = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/';
    $en = $r['enabled'] ?? true;
    return [
        'enabled' => !($en === false || $en === 0 || $en === '0' || $en === ''),
        'messages' => $messages,
        'interval' => min(30, max(2, (int)round((float)($r['interval'] ?? 5)) ?: 5)),
        'bg' => preg_match($hex, (string)($r['bg'] ?? '')) ? $r['bg'] : '#000000',
        'color' => preg_match($hex, (string)($r['color'] ?? '')) ? $r['color'] : '#ffffff',
        'start' => preg_match($date, (string)($r['start'] ?? '')) ? $r['start'] : '',
        'end' => preg_match($date, (string)($r['end'] ?? '')) ? $r['end'] : '',
        'countdown' => !empty($r['countdown']) && $r['countdown'] !== '0',
        'closable' => !empty($r['closable']) && $r['closable'] !== '0',
        'effect' => isset(announce_effects()[(string)($r['effect'] ?? '')]) ? $r['effect'] : 'fade',
    ];
}

function announce_read(): array {
    $raw = setting('announce_config', '');
    if ($raw !== '') {
        $j = json_decode($raw, true);
        if (is_array($j)) return announce_sanitize($j);
    }
    $c = announce_default();
    $old = setting('announcement', '');
    if ($old !== '') $c['messages'] = [['text' => $old, 'link' => '']];
    return $c;
}

function announce_ms(string $local): ?int {
    if ($local === '') return null;
    $t = strtotime($local . ':00+02:00');
    return $t === false ? null : $t * 1000;
}

function announce_active(array $c): bool {
    if (!$c['enabled'] || !$c['messages']) return false;
    $now = time() * 1000;
    $s = announce_ms($c['start']); $e = announce_ms($c['end']);
    if ($s !== null && $now < $s) return false;
    if ($e !== null && $now >= $e) return false;
    return true;
}

// يرسم الشريط (HTML + JS) إن كان نشطاً
function announce_render(?array $preview = null): void {
    $c = $preview === null ? announce_read() : announce_sanitize($preview);
    if ($preview === null && !announce_active($c)) return;
    if (!$c['messages']) return;
    $sig = substr(md5(json_encode([$c['messages'], $c['start'], $c['end']])), 0, 12);
    $end = announce_ms($c['end']);
    $cfg = ['messages' => $c['messages'], 'interval' => $c['interval'], 'end' => $end, 'start' => announce_ms($c['start']),
        'countdown' => $c['countdown'] && $end !== null, 'closable' => $c['closable'], 'sig' => $sig, 'effect' => $c['effect'],
        'dur' => max(14, 10 + array_sum(array_map(function ($m) { return mb_strlen($m['text']); }, $c['messages'])) * 0.5)];
    ?>
<style>
.ann-fade{animation:annIn .5s ease}@keyframes annIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ann-s{animation:annS .6s cubic-bezier(.22,.8,.3,1)}@keyframes annS{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:none}}
.ann-vwrap{height:1.6em;line-height:1.6em}.ann-v{animation:annV .5s cubic-bezier(.22,.8,.3,1)}@keyframes annV{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:none}}
.ann-track{display:flex;width:max-content;animation:annM linear infinite}.ann-ticker:hover .ann-track{animation-play-state:paused}
.ann-group{display:flex;flex-shrink:0;min-width:100vw;justify-content:space-around}
@keyframes annM{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.ann-track{animation:none}}
</style>
<div id="ann-bar" class="on-dark relative z-40 overflow-hidden <?= $c['effect'] === 'marquee' ? '' : 'px-10' ?> py-2.5 text-center text-xs font-bold sm:text-sm" style="background:<?= e($c['bg']) ?>;color:<?= e($c['color']) ?>">
  <div class="flex items-center justify-center gap-3">
    <div id="ann-wrap" class="min-w-0 flex-1 overflow-hidden"><a id="ann-text" class="inline-block" style="color:inherit"></a></div>
    <span id="ann-cd" dir="rtl" class="<?= $c['effect'] === 'marquee' ? 'absolute right-2 top-1/2 -translate-y-1/2' : '' ?> hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold tabular-nums" style="background:rgba(255,255,255,.2)"></span>
  </div>
  <button id="ann-x" type="button" aria-label="إغلاق" class="absolute left-3 top-1/2 hidden -translate-y-1/2 opacity-70 hover:opacity-100" style="color:inherit">✕</button>
</div>
<script>
(function(){
  var C = <?= json_encode($cfg, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?>;
  var bar = document.getElementById('ann-bar'), key = 'ann-closed-' + C.sig;
  try { if (C.closable && localStorage.getItem(key)) { bar.remove(); return; } } catch (e) {}
  var cd = document.getElementById('ann-cd'), x = document.getElementById('ann-x');
  var i = 0, eff = C.effect, wrap = document.getElementById('ann-wrap');
  function item(m) {
    var a = document.createElement(m.link ? 'a' : 'span');
    a.textContent = m.text; a.style.color = 'inherit';
    if (m.link) a.href = m.link;
    return a;
  }
  if (eff === 'marquee') {
    wrap.className = 'ann-ticker min-w-0 flex-1 overflow-hidden'; wrap.dir = 'ltr'; wrap.innerHTML = '';
    var track = document.createElement('div'); track.className = 'ann-track'; track.style.animationDuration = C.dur + 's';
    for (var g = 0; g < 2; g++) {
      var grp = document.createElement('div'); grp.className = 'ann-group';
      if (g) grp.setAttribute('aria-hidden', 'true');
      for (var r = 0; r < 3; r++) C.messages.forEach(function (m) {
        var w = document.createElement('span'); w.dir = 'rtl'; w.className = 'mx-8 inline-block whitespace-nowrap'; w.appendChild(item(m)); grp.appendChild(w);
      });
      track.appendChild(grp);
    }
    wrap.appendChild(track);
  } else {
    if (eff === 'vertical') wrap.classList.add('ann-vwrap');
    var cls = eff === 'slide' ? 'ann-s' : eff === 'vertical' ? 'ann-v' : 'ann-fade';
    var show = function () {
      wrap.innerHTML = '';
      var el = item(C.messages[i % C.messages.length]); el.className = cls + ' inline-block'; wrap.appendChild(el);
    };
    show();
    if (C.messages.length > 1) setInterval(function () { i++; show(); }, C.interval * 1000);
  }
  function p(n){ return (n < 10 ? '0' : '') + n; }
  function tick() {
    var now = Date.now();
    if ((C.end && now >= C.end) || (C.start && now < C.start)) { bar.remove(); return false; }
    if (C.countdown) {
      var s = Math.floor((C.end - now) / 1000), d = Math.floor(s / 86400); s %= 86400;
      cd.textContent = (d > 0 ? d + ' يوم ' : '') + p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60);
      cd.classList.remove('hidden');
    }
    return true;
  }
  if (tick() && (C.countdown || C.end)) setInterval(tick, 1000);
  if (C.closable) {
    x.classList.remove('hidden');
    x.onclick = function(){ try { localStorage.setItem(key, '1'); } catch (e) {} bar.remove(); };
  }
})();
</script>
<?php
}
