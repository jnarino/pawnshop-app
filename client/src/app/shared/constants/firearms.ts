export const FIREARM_TYPES = [
  'Pistol',
  'Revolver',
  'Rifle',
  'Shotgun',
  'Assault Rifle',
  'Carbine',
  'Machine Gun',
  'Submachine Gun',
  'Derringer',
  'Black Powder',
  'Muzzleloader',
  'Air Gun',
  'Crossbow',
  'Bow',
  'Other'
] as const;

export const FIREARM_ACTIONS = [
  'Semi-automatic',
  'Bolt action',
  'Lever action',
  'Pump action',
  'Break action',
  'Single action',
  'Double action',
  'Striker fired',
  'Hammer fired',
  'Revolver',
  'Full auto',
  'Burst fire',
  'Manual',
  'Other'
] as const;

export const FIREARM_CALIBERS = [
  // Popular pistol calibers
  '9MM', '.40 S&W', '.45 ACP', '.38 Special', '.357 Magnum',
  '.380 ACP', '.22 LR', '.25 ACP', '.32 ACP', '.44 Magnum',
  '.45 Long Colt', '.38 Super', '10MM', '.357 SIG', '.327 Federal',
  
  // Popular rifle calibers
  '.223 Remington', '5.56x45mm', '.308 Winchester', '7.62x51mm',
  '.30-06 Springfield', '.270 Winchester', '.243 Winchester',
  '.22-250 Remington', '.300 Winchester Magnum', '7mm Remington Magnum',
  '.338 Lapua Magnum', '.50 BMG', '6.5 Creedmoor', '.300 Blackout',
  '7.62x39mm', '5.45x39mm', '.30-30 Winchester', '.45-70 Government',
  
  // Shotgun gauges
  '12 Gauge', '20 Gauge', '16 Gauge', '28 Gauge', '.410 Bore',
  
  // Other common calibers
  '.17 HMR', '.22 WMR', '.204 Ruger', '6mm Creedmoor', '6.5 Grendel',
  '6.8 SPC', '.458 SOCOM', '.50 Beowulf'
] as const;

export const FIREARM_FINISHES = [
  'Blued',
  'Black',
  'Stainless Steel',
  'Nickel',
  'Chrome',
  'Parkerized',
  'Anodized',
  'Cerakote',
  'Duracoat',
  'Flat Dark Earth',
  'OD Green',
  'Tan',
  'Camo',
  'Two-tone',
  'Raw/Unfinished',
  'Other'
] as const;

export type FirearmType = typeof FIREARM_TYPES[number];
export type FirearmAction = typeof FIREARM_ACTIONS[number];
export type FirearmCaliber = typeof FIREARM_CALIBERS[number];
export type FirearmFinish = typeof FIREARM_FINISHES[number];
