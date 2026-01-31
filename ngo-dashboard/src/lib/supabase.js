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

// Teams API - Hierarchical team management
export const teamsApi = {
  // Get all teams (containers)
  async getAll() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // Table might not exist yet - create it
      console.log('Teams table error:', error);
      // Try to create teams table if it doesn't exist
      try {
        const { error: createError } = await supabase.rpc('exec', {
          sql: `CREATE TABLE IF NOT EXISTS teams (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          )`
        }).catch(() => ({}));
      } catch (e) {
        console.log('Could not auto-create teams table');
      }
      return [];
    }
    return data || [];
  },

  // Get all members
  async getAllMembers() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // Table might not exist yet
      console.log('Team members table error:', error);
      return [];
    }
    return data || [];
  },

  // Get teams with their members
  async getTeamsWithMembers() {
    const teams = await this.getAll();
    const members = await this.getAllMembers();
    
    return teams.map(team => ({
      ...team,
      members: members.filter(m => m.team_id === team.id)
    }));
  },

  // Create a new team (container)
  async createTeam(teamData) {
    const { data, error } = await supabase
      .from('teams')
      .insert([{
        name: teamData.name,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create a new team member
  async createMember(memberData) {
    const { data, error } = await supabase
      .from('team_members')
      .insert([{
        name: memberData.name,
        phone: memberData.phone,
        team_id: memberData.team_id || null,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a team (will set members to unassigned)
  async deleteTeam(id) {
    // First, unassign all members from this team
    await supabase
      .from('team_members')
      .update({ team_id: null })
      .eq('team_id', id);
    
    // Then delete the team
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Delete a team member
  async deleteMember(id) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Legacy method for backward compatibility
  async create(team) {
    return this.createMember({
      name: team.name,
      phone: team.phone,
      team_id: null
    });
  },

  // Legacy method for backward compatibility
  async delete(id) {
    return this.deleteMember(id);
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

// Voting API - Consensus system for report verification
export const votingApi = {
  async getVoteStats(reportId) {
    console.log('[INFO] getVoteStats() called for report:', reportId);
    const { data, error } = await supabase
      .from('report_votes')
      .select('vote_type')
      .eq('report_id', reportId);
    
    if (error) {
      console.error('[ERROR] Error fetching votes:', error);
      return {
        totalVotes: 0,
        accurateVotes: 0,
        inaccurateVotes: 0,
        unclearVotes: 0,
        accuracyPercentage: 0,
      };
    }

    const votes = data || [];
    const totalVotes = votes.length;
    const accurateVotes = votes.filter(v => v.vote_type === 'accurate').length;
    const inaccurateVotes = votes.filter(v => v.vote_type === 'inaccurate').length;
    const unclearVotes = votes.filter(v => v.vote_type === 'unclear').length;

    const accuracyPercentage = totalVotes > 0 
      ? Math.round((accurateVotes / totalVotes) * 100) 
      : 0;

    const stats = {
      reportId,
      totalVotes,
      accurateVotes,
      inaccurateVotes,
      unclearVotes,
      accuracyPercentage,
    };

    console.log('[SUCCESS] Vote stats:', stats);
    return stats;
  },

  async submitVote(reportId, voteType) {
    console.log('[INFO] submitVote() called:', { reportId, voteType });
    
    if (!['accurate', 'inaccurate', 'unclear'].includes(voteType)) {
      throw new Error('Invalid vote type');
    }

    // Get current session to check if user is authenticated
    const session = await authApi.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.warn('[WARN] No authenticated user, storing vote locally');
      return null;
    }

    const { data, error } = await supabase
      .from('report_votes')
      .upsert(
        {
          report_id: reportId,
          user_id: userId,
          vote_type: voteType,
        },
        { onConflict: 'report_id,user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[ERROR] Error submitting vote:', error);
      throw error;
    }

    console.log('[SUCCESS] Vote submitted:', data);
    return data;
  },

  async deleteVote(reportId) {
    console.log('[INFO] deleteVote() called for report:', reportId);
    
    const session = await authApi.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error('Must be authenticated to delete vote');
    }

    const { error } = await supabase
      .from('report_votes')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', userId);

    if (error) {
      console.error('[ERROR] Error deleting vote:', error);
      throw error;
    }

    console.log('[SUCCESS] Vote deleted');
  },

  async getUserVote(reportId) {
    console.log('[INFO] getUserVote() called for report:', reportId);
    
    const session = await authApi.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.log('[INFO] No authenticated user');
      return null;
    }

    const { data, error } = await supabase
      .from('report_votes')
      .select('vote_type, created_at')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected
      console.error('[ERROR] Error fetching user vote:', error);
      return null;
    }

    console.log('[SUCCESS] User vote:', data);
    return data || null;
  }
};

