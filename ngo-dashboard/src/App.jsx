import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, authApi } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Teams from './pages/Teams';
import Logistics from './pages/Logistics';
import Login from './pages/Login';

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const setupUserRole = async (user) => {
    if (!user) return null;
    
    // First check if profile exists
    let role = await authApi.getUserRole(user.id);
    
    // If no role or profile, create one with 'ngo' role for demo account
    if (!role && user.email === 'ngo@lifelines.app') {
      await supabase.from('user_profiles').upsert({
        id: user.id,
        phone: '+970500000000',
        role: 'ngo',
        updated_at: new Date().toISOString()
      });
      role = 'ngo';
    }
    
    return role;
  };

  useEffect(() => {
    // Check initial session
    authApi.getSession().then(async (session) => {
      setSession(session);
      if (session?.user) {
        const role = await setupUserRole(session.user);
        setUserRole(role);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const role = await setupUserRole(session.user);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        Loading...
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <Login />;
  }

  // Not an NGO user
  if (userRole !== 'ngo') {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Access Denied</h1>
          <p>This dashboard is only for NGO users.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => authApi.signOut()}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar onSignOut={() => authApi.signOut()} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/logistics" element={<Logistics />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
