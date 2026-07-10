export type WeaponId = "bolter" | "chainsword" | "plasma" | "grenade";

export interface SanctifiedDetails {
  litany: string;
  englishTranslation: string;
  perkName: string;
  perkDescription: string;
}

export interface Weapon {
  id: WeaponId;
  name: string;
  description: string;
  damage: number;
  fireRate: number; // in ms
  ammo: number;
  maxAmmo: number;
  unlimitedAmmo: boolean;
  color: string;
  sanctified?: SanctifiedDetails;
}

export type EnemyType = "feline" | "canine" | "horned" | "boss";

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  size: number;
  color: string;
  name: string;
  state: "active" | "staggered" | "dying" | "dead";
  staggerTimer: number; // for glory execution window
  angle: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  isBlood: boolean;
  bloodStain?: boolean; // persists on floor
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  damage: number;
  color: string;
  type: WeaponId;
  splashRadius?: number;
}

export interface SoundSettings {
  chantVolume: number; // 0 to 1
  screechVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
}

export interface GameSettings {
  bloodIntensity: "none" | "medium" | "extreme";
  fogDensity: "clear" | "medium" | "heavy";
  difficulty: "acolyte" | "paladin" | "eternal_crusader";
  sound: SoundSettings;
}

export interface Relic {
  name: string;
  description: string;
}

export interface Chronicle {
  id: string;
  title: string;
  narrative: string;
  englishLore: string;
  relicRecovered?: string;
  isCustom?: boolean;
}
