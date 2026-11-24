export function initHeroMotion(root) {
  const track = root.querySelector('.hp-track');
  const cards = [...track.children];
  const copies = [...root.querySelectorAll('.hp-copy[data-copy]')];
  const dots = [...root.querySelectorAll('[data-dot]')];
  const cta = root.querySelector('.hp-fixed-button a');
  const n = copies.length;
  if (!n) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0, position = n > 1 ? 1 : 0, busy = false, lastAct = 0, touch = null, moved = false, timer, labelTimer, finishTimer;
  const animations = [];
  const original = copies.map(copy => copy.innerHTML);
  const zooms = [];
  const zoom = pos => {
    const image = cards[pos]?.querySelector('img');
    if (image && !reduced) zooms.push(image.animate([{transform:'scale(1.16)'},{transform:'scale(1)'}],{duration:850,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}));
  };
  const step = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || '0');
  const place = (animate = false, dx = 0) => {
    track.style.transition = animate && !reduced ? 'transform .85s cubic-bezier(.32,.72,0,1)' : 'none';
    track.style.transform = `translate3d(${-position * step() + dx}px,0,0)`;
  };
  copies.forEach((copy, i) => {
    copy.style.visibility = i === 0 ? 'visible' : 'hidden';
    copy.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    copy.querySelectorAll('h1,h2,p').forEach(el => {
      const value = el.textContent;
      el.setAttribute('aria-label', value);
      el.textContent = '';
      let unitIndex = 0;
      value.split('\n').forEach(line => {
        const row = document.createElement('span'); row.className = 'hp-line'; row.dir = 'auto'; row.setAttribute('aria-hidden', 'true');
        line.split(/\s+/).forEach(word => {
          const token = document.createElement('span'); token.className = 'hp-token';
          if (/[\u0600-\u06ff]/.test(word)) {
            token.textContent = word; token.classList.add('hp-unit'); token.dataset.unit = unitIndex++;
          } else {
            token.dir = 'ltr'; token.style.unicodeBidi = 'isolate';
            [...word].forEach(ch => { const letter = document.createElement('span'); letter.textContent = ch; letter.className = 'hp-unit'; letter.dataset.unit = unitIndex++; token.appendChild(letter); });
          }
          row.append(token, document.createTextNode(' '));
        });
        el.appendChild(row);
      });
    });
  });
  const label = i => { cta.textContent = copies[i].dataset.label; cta.setAttribute('href', copies[i].dataset.href); };
  const mark = i => dots.forEach((dot, k) => { dot.classList.toggle('active', k === i); dot.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  const finish = () => {
    clearTimeout(finishTimer); clearTimeout(labelTimer); busy = false; position = n > 1 ? index + 1 : 0; place();
    copies.forEach((copy, i) => { copy.style.visibility = i === index ? 'visible' : 'hidden'; copy.setAttribute('aria-hidden', i === index ? 'false' : 'true'); });
    label(index);
  };
  const go = (direction, target) => {
    if (n < 2 || busy) return;
    const next = target === undefined ? (index + direction + n) % n : target;
    if (next === index) return;
    busy = true; lastAct = Date.now();
    const old = index; index = next;
    position = target === undefined ? position + direction : next + 1;
    const incoming = copies[next], outgoing = copies[old];
    incoming.style.visibility = 'visible'; incoming.setAttribute('aria-hidden', 'false'); outgoing.setAttribute('aria-hidden', 'true');
    animations.splice(0).forEach(a => a.cancel());
    const run = (copy, enter) => copy.querySelectorAll('h1,h2,p').forEach(el => {
      el.querySelectorAll('.hp-unit').forEach(unit => {
        const delay = Math.min(Number(unit.dataset.unit) * (el.tagName === 'P' ? 18 : 24), 450);
        const a = unit.animate(enter ? [{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}] : [{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-16px)'}], {duration:reduced ? 0 : enter ? 420 : 300, delay:reduced ? 0 : delay + (enter ? 320 : 0), fill:'both', easing:'ease-out'});
        animations.push(a);
      });
    });
    run(outgoing, false); run(incoming, true); zooms.splice(0).forEach(a=>a.cancel()); zoom(position); place(true); mark(next);
    labelTimer = setTimeout(() => label(next), reduced ? 0 : 420);
    finishTimer = setTimeout(finish, reduced ? 10 : 1250);
  };
  const handlers = [];
  const on = (el, event, fn, opts) => { el.addEventListener(event, fn, opts); handlers.push(() => el.removeEventListener(event, fn, opts)); };
  root.querySelectorAll('[data-go]').forEach(btn => on(btn, 'click', () => go(Number(btn.dataset.go))));
  dots.forEach((btn,i) => on(btn, 'click', () => go(i > index ? 1 : -1, i)));
  on(root, 'pointerdown', e => { if (n < 2 || busy || e.pointerType === 'mouse') return; touch = {id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),mode:''}; moved = false; lastAct = Date.now(); });
  on(root, 'pointermove', e => {
    if (!touch || touch.id !== e.pointerId) return;
    const dx = e.clientX-touch.x, dy=e.clientY-touch.y;
    if (!touch.mode && Math.max(Math.abs(dx),Math.abs(dy)) > 8) touch.mode = Math.abs(dx)>Math.abs(dy)*1.2 ? 'h':'v';
    if (touch.mode === 'h') { moved = true; place(false, Math.sign(dx)*Math.min(160,Math.abs(dx)*.6)); }
  });
  const end = e => { if (!touch || touch.id !== e.pointerId) return; const t=touch; touch=null; lastAct=Date.now(); if(t.mode !== 'h')return; const dx=e.clientX-t.x, v=Math.abs(dx)/Math.max(1,performance.now()-t.t); if(e.type!=='pointercancel' && (Math.abs(dx)>55 || (v>.45 && Math.abs(dx)>24))) go(dx<0?1:-1); else place(true); };
  on(root,'pointerup',end); on(root,'pointercancel',end);
  on(root,'click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false;}},true);
  on(window,'resize',()=>{ if (busy) finish(); else place(); });
  place(); mark(0); label(0); zoom(position);
  if(n>1 && !reduced) timer=setInterval(()=>{if(!document.hidden && !touch && !root.matches(':hover') && !root.contains(document.activeElement) && Date.now()-lastAct>4000)go(1);},6000);
  root.dataset.ready='true';
  return () => {clearInterval(timer);clearTimeout(labelTimer);clearTimeout(finishTimer);animations.forEach(a=>a.cancel());zooms.forEach(a=>a.cancel());handlers.forEach(fn=>fn());copies.forEach((copy,i)=>{copy.innerHTML=original[i];});};
}

const root=document.getElementById('hero-slider');if(root)initHeroMotion(root);
