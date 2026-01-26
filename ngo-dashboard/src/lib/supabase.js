import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niwiwfngnejwqlulcuin.supabase.co';
const supabaseAnonKey = 'sb_publishable_2Tbbi5zeRDl02pz0mOCeXg_U9CynWGz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Reports API
export const reportsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getStats() {
    const { data, error } = await supabase
      .from('reports')
      .select('status');
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending' || !r.status).length,
      in_progress: data.filter(r => r.status === 'in_progress').length,
      resolved: data.filter(r => r.status === 'resolved').length,
    };
    
    return stats;
  }
};

// Teams API
export const teamsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // Table might not exist yet
      console.log('Teams table error:', error);
      return [];
    }
    return data || [];
  },

  async create(team) {
    const { data, error } = await supabase
      .from('teams')
      .insert([team])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Auth
export const authApi = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    try {
      await supabase.auth.signOut();
      // Force reload to clear state
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
      // Still reload even on error
      window.location.reload();
    }
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getUserRole(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) return null;
    return data?.role;
  }
};
