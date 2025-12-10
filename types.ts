export interface FilterState {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  grayscale: number;
  blur: number;
  sharpness: number; // Simulated via contrast+brightness tweak or CSS hack
  vignette: number; // Simulated via overlay
}

export enum AppScreen {
  LOGIN = 'LOGIN',
  EDITOR = 'EDITOR'
}

export interface NavItem {
  icon: string;
  label: string;
  id: string;
}