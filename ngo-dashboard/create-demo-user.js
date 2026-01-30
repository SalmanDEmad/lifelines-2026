// Run this once to create a demo NGO user
// Usage: node create-demo-user.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niwiwfngnejwqlulcuin.supabase.co';
const supabaseAnonKey = 'sb_publishable_2Tbbi5zeRDl02pz0mOCeXg_U9CynWGz';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createDemoUser() {
  console.log('Creating demo NGO user...');
  
  // Sign up the demo user
  const { data, error } = await supabase.auth.signUp({
    email: 'ngo@lifelines.app',
    password: 'demo1234',
    options: {
      data: {
        role: 'ngo'
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('User already exists. You can login with:');
      console.log('Email: ngo@lifelines.app');
      console.log('Password: demo1234');
      return;
    }
    console.error('Error creating user:', error.message);
    return;
  }

  console.log('User created successfully!');
  console.log('User ID:', data.user?.id);
  
  // Create profile with NGO role
  if (data.user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: data.user.id,
        phone: '+970500000000',
        role: 'ngo',
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.log('Profile creation note:', profileError.message);
    } else {
      console.log('NGO profile created!');
    }
  }

  console.log('\n[SUCCESS] Demo NGO Account Created!');
  console.log('================================');
  console.log('Email: ngo@lifelines.app');
  console.log('Password: demo1234');
  console.log('================================');
}

createDemoUser();
