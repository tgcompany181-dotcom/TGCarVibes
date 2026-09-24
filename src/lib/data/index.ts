import 'server-only';
import { dataMode } from '../config';
import { demoRepo } from './demo';
import { localRepo } from './local';
import { supabaseRepo } from './supabase';
import type { Repo } from './types';

export const getRepo = (): Repo => {
  const mode = dataMode();
  return mode === 'supabase' ? supabaseRepo : mode === 'local' ? localRepo : demoRepo;
};
export type { Repo };
