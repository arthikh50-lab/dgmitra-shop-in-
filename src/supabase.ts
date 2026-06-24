import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://yqrhcpabmkqttgjctjnk.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_cyN7nHIrxJDJ5m8MnOaUAg_X0eRwBAn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const loginWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) {
    if (error.message?.includes('provider is not enabled')) {
      alert('Google authentication is not enabled in your Supabase project. Please enable it in the Supabase Dashboard under Authentication > Providers > Google.');
    }
    throw error;
  }
  return data;
};

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const uploadBase64ToStorage = async (base64: string, path: string): Promise<string> => {
  try {
    const base64Data = base64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rewear-storage')
      .upload(path, buffer, {
        contentType: base64.split(';')[0].split(':')[1],
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('rewear-storage')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Storage Upload Error:", error);
    throw error;
  }
};
