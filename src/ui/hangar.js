import { CFG } from '../config.js';
import { addCredits, canUpgrade, upgrade } from '../storage.js';

export function createHangar({ onPlay }) {
  const el = document.createElement('div');
  el.className = 'screen';
  el.id = 'screen-hangar';
  el.innerHTML = `<div class="menu-card hangar-card">
    <div class="hangar-head">
      <div class="hangar-nick" id="h-nick"></div>
      <div class="hangar-credits" id="h-credits"></div>
    </div>
    
    <!-- Визуализация корабля -->
    <div style="display:flex; justify-content:center; margin-bottom:20px;">
      <canvas id="hangar-ship" width="200" height="150"></canvas>
    </div>

    <div class="hangar-grid">
      <div>
        <div class="menu-sub" style="text-align:left">УЛУЧШЕНИЯ</div>
        <div class="upgrade-list" id="h-upgrades"></div>
      </div>
      <div>
        <div class="menu-sub" style="text-align:left">ЛОКАЦИЯ</div>
        <div class="loc-list" id="h-locations"></div>
      </div>
    </div>
    <div style="margin-top:18px"><button class="btn" id="h-play">В БОЙ</button></div>
    <div class="menu-hint">ENTER — ПАУЗА ВО ВРЕМЯ БОЯ</div>
  </div>`;
  document.body.appendChild(el);

  const nickEl = el.querySelector('#h-nick');
  const creditsEl = el.querySelector('#h-credits');
  const upgEl = el.querySelector('#h-upgrades');
  const locEl = el.querySelector('#h-locations');
  const playBtn = el.querySelector('#h-play');
  const shipCanvas = el.querySelector('#hangar-ship');
  const shipCtx = shipCanvas.getContext('2d');

  let profile = null;
  let selectedLoc = 'space';

  function drawShipPreview() {
    shipCtx.clearRect(0, 0, 200, 150);
    shipCtx.save();
    shipCtx.translate(100, 75);
    
    // Рисуем корабль (как в игре)
    const accent = CFG.LOCATIONS[selectedLoc].accent;
    
    // Сопло
    shipCtx.beginPath();
    shipCtx.moveTo(-5, 10); shipCtx.lineTo(0, 25); shipCtx.lineTo(5, 10);
    shipCtx.strokeStyle = accent; shipCtx.lineWidth = 2; shipCtx.stroke();

    // Корпус
    shipCtx.beginPath();
    shipCtx.moveTo(0, -22); shipCtx.lineTo(13, 12);
    shipCtx.lineTo(0, 5); shipCtx.lineTo(-13, 12);
    shipCtx.closePath();
    shipCtx.fillStyle = 'rgba(94,242,255,0.1)';
    shipCtx.fill();
    shipCtx.strokeStyle = accent;
    shipCtx.lineWidth = 2;
    shipCtx.shadowColor = accent; shipCtx.shadowBlur = 15;
    shipCtx.stroke();

    // Кабина
    shipCtx.beginPath();
    shipCtx.moveTo(0, -10); shipCtx.lineTo(4, 5); shipCtx.lineTo(-4, 5);
    shipCtx.closePath();
    shipCtx.fillStyle = '#e9feff';
    shipCtx.fill();

    shipCtx.restore();
  }

  function render() {
    nickEl.textContent = (profile.nickname || 'ПИЛОТ').toUpperCase();
    creditsEl.textContent = `${profile.credits} ₡`;
    drawShipPreview();

    upgEl.innerHTML = Object.entries(CFG.UPGRADES).map(([id,u]) => {
      const lvl = profile.upgrades[id]|0;
      const chk = canUpgrade(profile, id);
      const segs = Array.from({length:u.max}, (_,i) =>
        `<div class="upg-seg ${i<lvl?'on':''}"></div>`).join('');
      const costLabel = lvl>=u.max ? 'MAX' : `${u.cost[lvl]} ₡`;
      const disabled = !chk.ok ? 'disabled' : '';
      return `<div class="upg-row">
        <div>
          <div class="upg-name">${u.name}</div>
          <div class="upg-level">ур. ${lvl}/${u.max} · ${u.desc}</div>
          <div class="upg-bar">${segs}</div>
        </div>
        <button class="btn" style="padding:8px 14px;font-size:11px" data-upg="${id}" ${disabled}>
          ${costLabel}
        </button>
      </div>`;
    }).join('');

    upgEl.querySelectorAll('[data-upg]').forEach(b => {
      b.onclick = () => {
        const r = upgrade(profile, b.dataset.upg);
        if (r.ok) render();
      };
    });

    locEl.innerHTML = Object.entries(CFG.LOCATIONS).map(([id,l]) => `
      <div class="loc-card ${id===selectedLoc?'selected':''}" data-loc="${id}"
           style="${id===selectedLoc?'border-color:#5ef2ff;box-shadow:0 0 20px rgba(94,242,255,.3)':''}">
        <div class="loc-name"><span class="loc-dot" style="background:${l.accent};box-shadow:0 0 10px ${l.accent}"></span>${l.name}</div>
      </div>`).join('');
    locEl.querySelectorAll('[data-loc]').forEach(c => {
      c.onclick = () => { 
        selectedLoc = c.dataset.loc; 
        render(); 
      };
    });
  }

  playBtn.onclick = () => { hide(); onPlay(profile, selectedLoc); };

  function show(p) {
    profile = p;
    el.classList.add('show');
    render();
  }
  function hide() { el.classList.remove('show'); }

  return { show, hide, el };
}