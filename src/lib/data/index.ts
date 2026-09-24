import 'server-only';
import { isSupabaseConfigured } from '../config';
import { demoRepo } from './demo';
import { supabaseRepo } from './supabase';
import type { Repo } from './types';

export const getRepo = (): Repo => (isSupabaseConfigured() ? supabaseRepo : demoRepo);
export type { Repo };
