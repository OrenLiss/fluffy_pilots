import { loadProfile, createProfile, resetProfile, validateNickname } from '../storage.js';

const SHIPS = [
  { id:'fighter', name:'ИСТРЕБИТЕЛЬ', desc:'Быстрый, сбалансированный' },
];

export function createMenu({ onStart }) {
  const el = document.createElement('div');
  el.className = 'screen';
  el.id = 'screen-menu';
  el.innerHTML = `
    <div class="menu-card">
      <div class="menu-title">НЕОН · КОСМОС</div>
      <div class="menu-sub">ПИЛОТ</div>
      <input class="menu-input" id="menu-nick" maxlength="16" placeholder="ВВЕДИ НИК" />
      <div class="menu-sub">КОРАБЛЬ</div>
      <div class="ship-grid" id="menu-ships"></div>
      <div class="menu-error" id="menu-error"></div>
      <div class="menu-row" id="menu-actions"></div>
      <div class="menu-hint">ДАННЫЕ ХРАНЯТСЯ ЛОКАЛЬНО</div>
    </div>
  `;
  document.body.appendChild(el);

  const nickEl   = el.querySelector('#menu-nick');
  const shipsEl  = el.querySelector('#menu-ships');
  const errEl    = el.querySelector('#menu-error');
  const actionsEl= el.querySelector('#menu-actions');

  let selectedShip = SHIPS[0].id;

  // отрисовка кораблей
  shipsEl.innerHTML = SHIPS.map(s => `
    <div class="ship-card ${s.id===selectedShip?'selected':''}" data-id="${s.id}">
      ${shipSVG()}
      <div style="text-align:left">
        <div class="ship-name">${s.name}</div>
        <div class="ship-desc">${s.desc}</div>
      </div>
    </div>
  `).join('');
  shipsEl.querySelectorAll('.ship-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedShip = card.dataset.id;
      shipsEl.querySelectorAll('.ship-card').forEach(c => c.classList.toggle('selected', c===card));
    });
  });

  function renderForProfile(profile) {
    if (profile && profile.nickname) {
      nickEl.value = profile.nickname;
      nickEl.disabled = true;
      actionsEl.innerHTML = `
        <button class="btn" id="menu-continue">В АНГАР</button>
        <button class="btn danger" id="menu-reset">СБРОСИТЬ</button>
      `;
      actionsEl.querySelector('#menu-continue').onclick = () => {
        hide();
        onStart(profile);
      };
      actionsEl.querySelector('#menu-reset').onclick = () => {
        if (confirm('Сбросить весь прогресс?')) {
          resetProfile();
          location.reload();
        }
      };
    } else {
      nickEl.disabled = false;
      actionsEl.innerHTML = `<button class="btn" id="menu-create">НАЧАТЬ</button>`;
      actionsEl.querySelector('#menu-create').onclick = () => {
        const v = validateNickname(nickEl.value);
        if (!v.ok) { errEl.textContent = v.msg; return; }
        errEl.textContent = '';
        const p = createProfile(v.value, selectedShip);
        hide();
        onStart(p);
      };
    }
  }

  function show(profile) {
    el.classList.add('show');
    renderForProfile(profile);
    if (!profile) setTimeout(()=> nickEl.focus(), 50);
  }
  function hide() { el.classList.remove('show'); }

  return { show, hide, el };
}

function shipSVG() {
  return `<svg width="48" height="48" viewBox="-24 -24 48 48">
    <polygon points="0,-20 12,10 0,4 -12,10" fill="rgba(94,242,255,.12)" stroke="#8ff9ff" stroke-width="2"/>
  </svg>`;
}