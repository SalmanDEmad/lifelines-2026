import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: 'citizen' | 'ngo' | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone: string, role: 'citizen' | 'ngo') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'citizen' | 'ngo' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Add a small delay to ensure profile creation completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        
        // If user not found (PGRST116), retry once after delay
        if (error.code === 'PGRST116') {
          console.log('Profile not found, retrying in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: retryData, error: retryError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', userId)
            .single();
          
          if (retryError) {
            console.warn('Retry failed - defaulting to citizen');
            setUserRole('citizen');
          } else {
            setUserRole(retryData.role);
          }
        } else if (error.code === 'PGRST205') {
          // Table doesn't exist
          console.warn('Table missing - logging out user');
          await supabase.auth.signOut();
          setUserRole(null);
          setSession(null);
          setUser(null);
        } else {
          // Other errors - default to citizen
          setUserRole('citizen');
        }
      } else {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('citizen'); // Default to citizen
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string, role: 'citizen' | 'ngo') => {
    console.log('Starting signup with:', { email, name, phone, role });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          role,
        },
      },
    });

    if (error) {
      console.error('Supabase auth.signUp error:', error);
      throw error;
    }

    console.log('Auth signup successful, user:', data.user?.id);

    // Create user profile BEFORE auth state change triggers
    if (data.user) {
      console.log('Attempting to create user profile for:', data.user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: data.user.id,
            email,
            name,
            phone,
            role,
          },
        ])
        .select();

      if (profileError) {
        console.error('[ERROR] Profile creation failed:', profileError);
        console.error('Error code:', profileError.code);
        console.error('Error message:', profileError.message);
        console.error('Error details:', profileError.details);
        
        // Don't throw - let user continue
      } else {
        console.log('[SUCCESS] User profile created successfully:', profileData);
        // Set the role immediately after successful creation
        setUserRole(role);
      }
    } else {
      console.warn('No user data returned from signup');
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting login with:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    
    console.log('Login successful, user:', data.user?.id);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
