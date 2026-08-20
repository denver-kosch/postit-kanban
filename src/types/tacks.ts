import type { Tables, TablesInsert, TablesUpdate } from '@/types/database';

export type Tack = Tables<'tacks'>;
export type TackGroup = Tables<'tack_groups'>;
export type Tag = Tables<'tags'>;

export type NewTack = TablesInsert<'tacks'>;
export type TackUpdate = TablesUpdate<'tacks'>;