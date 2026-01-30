import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niwiwfngnejwqlulcuin.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pd2l3Zm5nbmVqd3FsdWxjdWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzc0NjUsImV4cCI6MjA4NDkxMzQ2NX0.03Q7r9-GkUsNbD9iW8QyRJCotfzNVzTpgEIYAo5JDno';

// Create single instance only
let supabaseInstance = null;

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabase();

// Reports API
export const reportsApi = {
  async getAll() {
    console.log('[INFO] getAll() called');
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[ERROR] Error:', error);
      throw error;
    }
    console.log('[SUCCESS] Fetched', data?.length || 0, 'reports');
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
    console.log('[INFO] getStats() called');
    const { data, error } = await supabase
      .from('reports')
      .select('status');
    
    if (error) {
      console.error('[ERROR] Error:', error);
      throw error;
    }
    
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(r => r.status === 'pending' || !r.status).length || 0,
      in_progress: data?.filter(r => r.status === 'in_progress').length || 0,
      resolved: data?.filter(r => r.status === 'resolved').length || 0,
    };
    
    console.log('[SUCCESS] Stats:', stats);
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
      console.log('[INFO] Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[ERROR] Sign out error:', error);
      } else {
        console.log('[SUCCESS] Signed out successfully');
      }
    } catch (error) {
      console.error('[ERROR] Sign out exception:', error);
    } finally {
      // Clear any cached data and reload
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
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
