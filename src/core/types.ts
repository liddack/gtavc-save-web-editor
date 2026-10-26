import type { Option, Text } from './catalogs.ts';
export type Section =
  | 'player'
  | 'weapons'
  | 'world'
  | 'garages'
  | 'gangs'
  | 'spawns'
  | 'stats'
  | 'progress';
export type ScalarType = 'u8' | 'u16' | 'i16' | 'u32' | 'i32' | 'f32' | 'name';
export interface Field {
  id: string;
  section: Section;
  group: Text;
  label: Text;
  help?: Text;
  offset: number;
  type: ScalarType;
  min?: number;
  max?: number;
  options?: Option[];
  readOnly?: boolean;
  mirrors?: number[];
}
export type Value = number | string;
export type Changes = Record<string, Value>;
export interface Block {
  index: number;
  header: number;
  data: number;
  size: number;
}
export interface Inspection {
  valid: boolean;
  format: 'retail' | 'steam' | 'unsupported';
  name: string;
  size: number;
  storedChecksum: number;
  calculatedChecksum: number;
  blocks: Block[];
  diagnostics: string[];
}
export interface RetailDocument {
  original: Uint8Array;
  inspection: Inspection;
  fields: Field[];
}
export interface ValidationError {
  field: string;
  code: string;
}
