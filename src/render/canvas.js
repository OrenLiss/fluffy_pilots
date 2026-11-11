import { S } from '../state.js';

let ctx, DPR = 1, W = 0, H = 0;

export const getCtx = () => ctx;
export const getSize = () => ({ W, H, DPR });

export function initCanvas(canvas) {
  ctx = canvas.getContext('2d');
  resize(canvas);
}

export function resize(canvas) {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  initStars();
}

export function initStars() {
  S.stars = [];
  const count = Math.round((W * H) / 8000);
  for (let i = 0; i < count; i++) {
    S.stars.push({
      x: Math.random() * W, y: Math.random() * H,
      z: Math.random() * 0.85 + 0.15,
      s: Math.random() * 1.2 + 0.5
    });
  }
}