import { LogOut } from 'lucide-react';
import { authApi } from '../lib/supabase';

export default function Header() {
  const handleLogout = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect anyway
      window.location.href = '/';
    }
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '15px 20px',
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <button 
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </header>
  );
}
