import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, authApi } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Teams from './pages/Teams';
import Logistics from './pages/Logistics';
import Analytics from './pages/Analytics';
import Login from './pages/Login';

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('ngo'); // Default to ngo for demo
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session with timeout
    const sessionPromise = authApi.getSession();
    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve(null), 5000)
    );

    Promise.race([sessionPromise, timeoutPromise])
      .then((session) => {
        setSession(session);
        // For demo purposes, assume ngo role if logged in
        if (session?.user) {
          setUserRole('ngo');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Session error:', err);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        setUserRole('ngo');
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontSize: '18px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', fontSize: '24px' }}>Loading...</div>
          <div style={{ color: '#666' }}>Initializing dashboard</div>
        </div>
      </div>
    );
  }

  // Not logged in - show login
  if (!session) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/logistics" element={<Logistics />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
