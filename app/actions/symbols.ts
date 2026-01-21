'use server';

import { createClient, requireUser } from '@/lib/supabase/server';
import type { Symbol, CreateSymbolInput } from '@/types';

/**
 * Server Action: Get all symbols for the current user
 */
export async function getSymbols(): Promise<{
  symbols: Symbol[];
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('symbols')
    .select('*')
    .eq('user_id', user.id)
    .order('ticker', { ascending: true });

  if (error) {
    return { symbols: [], error: error.message };
  }

  return { symbols: (data as Symbol[]) || [], error: null };
}

/**
 * Server Action: Create a new symbol
 */
export async function createSymbol(
  input: CreateSymbolInput
): Promise<{ symbol: Symbol | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!input.ticker || !input.ticker.trim()) {
    return { symbol: null, error: 'Symbol ticker is required' };
  }

  const { data, error } = await supabase
    .from('symbols')
    .insert({
      user_id: user.id,
      ticker: input.ticker.trim().toUpperCase(),
    })
    .select()
    .single();

  if (error) {
    return { symbol: null, error: error.message };
  }

  return { symbol: data as Symbol, error: null };
}
