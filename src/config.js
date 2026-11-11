export const CFG = {
  SHIP_SPEED_K: 18,
  FIRE_CD: 0.115,
  BULLET_VY: -950,
  SHIP_TOP: 70,
  SHIP_BOTTOM_OFFSET: 95,
  HIT_R: 12,

  BASE_HULL: 6,
  BASE_SHIELD: 6,
  SHIELD_SEGMENT_REGEN: 3.0,   
  SHIELD_REGEN_DELAY: 6.0,     

  // ==== Ульта ====
  ULT_MAX: 100,
  ULT_PER_HIT: 4,              
  ULT_DOUBLE_TAP_MS: 280,      
  ULT_RADIUS: 260,

  // ==== Прокачка ====
  UPGRADES: {
    agility:  { name:'Манёвренность', max:5, cost:[80,160,320,640,1280], desc:'+4% шанс уворота' },
    shield:   { name:'Щит',          max:5, cost:[100,200,400,800,1600], desc:'+1 деление щита' },
    speed:    { name:'Скорость',     max:5, cost:[90,180,360,720,1440],  desc:'+8% скорость' },
    hull:     { name:'Живучесть',    max:5, cost:[120,240,480,960,1920], desc:'+1 деление корпуса' },
  },
  AGILITY_PER_LVL: 0.04,
  SPEED_PER_LVL:   0.08,

  CREDITS_PER_100LY: 1,
  CREDITS_ENEMY: { scout: 3, fighter: 6, tank: 12 },

  COLORS: {
    ship: '#8ff9ff', bullet: '#a8ff60', 
    asteroid: '#b07cff', enemy: '#ff4d7a', ebullet: '#ffd166',
  },

  // ==== Локации (обновлены) ====
  LOCATIONS: {
    space:     { name:'Открытый космос', hazard:'asteroid',
                 bg:'#04050b', star:'#6f8fb8', starHi:'#cfe9ff',
                 hazardColor:'#b07cff', hazardGlow:'#8a4dff', accent:'#5ef2ff' },
    frozen:    { name:'Морозная планета', hazard:'spike',
                 bg:'#04101a', star:'#5aa9c8', starHi:'#d6f6ff',
                 hazardColor:'#7fe3ff', hazardGlow:'#2aa8d0', accent:'#a8f0ff' },
    desert:    { name:'Пустынная планета', hazard:'dust',
                 bg:'#150b04', star:'#c89050', starHi:'#ffe2b0',
                 hazardColor:'#e0a060', hazardGlow:'#c06a20', accent:'#ffc070' },
    tropical:  { name:'Тропическая планета', hazard:'liana',
                 bg:'#03140d', star:'#3fbf8a', starHi:'#c8ffe0',
                 hazardColor:'#3fbf8a', hazardGlow:'#1f8a5a', accent:'#7dffb0' },
  },
};