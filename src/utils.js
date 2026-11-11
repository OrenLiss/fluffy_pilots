export const clamp = (v,a,b)=> v<a?a:(v>b?b:v);
export const rand  = (a,b)=> a + Math.random()*(b-a);
export const randInt = (a,b)=> Math.floor(rand(a,b+1));
export const dist2 = (ax,ay,bx,by)=>{ const dx=ax-bx, dy=ay-by; return dx*dx+dy*dy; };

export function makeShape(){
  const n = randInt(7,10), pts=[];
  for(let i=0;i<n;i++) pts.push({a:(i/n)*Math.PI*2, k:rand(0.72,1.12)});
  return pts;
}

export function formatNum(n, digits=1){
  return Number(n).toFixed(digits);
}