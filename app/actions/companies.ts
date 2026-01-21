'use server';

import { createClient, requireUser } from '@/lib/supabase/server';
import type { Company, CreateCompanyInput } from '@/types';

/**
 * Server Action: Get all companies for the current user
 */
export async function getCompanies(): Promise<{
  companies: Company[];
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    return { companies: [], error: error.message };
  }

  return { companies: (data as Company[]) || [], error: null };
}

/**
 * Server Action: Create a new company
 */
export async function createCompany(
  input: CreateCompanyInput
): Promise<{ company: Company | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!input.name || !input.name.trim()) {
    return { company: null, error: 'Company name is required' };
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
    })
    .select()
    .single();

  if (error) {
    return { company: null, error: error.message };
  }

  return { company: data as Company, error: null };
}
