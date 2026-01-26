import { useState } from 'react';
import { authApi, supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await authApi.signIn(email, password);
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const createDemoAccount = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Try to sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: 'ngo@amal.app',
        password: 'demo1234',
        options: {
          data: { role: 'ngo' }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setMessage('Demo account exists! Use credentials below to login.');
          setEmail('ngo@amal.app');
          setPassword('demo1234');
        } else {
          throw signUpError;
        }
      } else if (data.user) {
        // Create profile
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          phone: '+970500000000',
          role: 'ngo',
          updated_at: new Date().toISOString()
        });
        setMessage('Demo account created! You can now login.');
        setEmail('ngo@amal.app');
        setPassword('demo1234');
      }
    } catch (err) {
      setError(err.message || 'Failed to create demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Amal</h1>
        <p>NGO Dashboard Login</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ color: '#059669', fontSize: 14, marginBottom: 16 }}>
              {message}
            </p>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            Demo Credentials:
          </p>
          <div style={{ 
            background: '#f3f4f6', 
            padding: 12, 
            borderRadius: 8, 
            fontSize: 13,
            marginBottom: 12 
          }}>
            <p><strong>Email:</strong> ngo@amal.app</p>
            <p><strong>Password:</strong> demo1234</p>
          </div>
          <button 
            type="button"
            onClick={createDemoAccount}
            className="btn btn-secondary"
            disabled={loading}
            style={{ width: '100%', fontSize: 13 }}
          >
            Create Demo Account
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: '#666' }}>
          Only NGO accounts can access this dashboard.
        </p>
      </div>
    </div>
  );
}
