import { LogOut, AlertCircle, Users, Map, BarChart3 } from 'lucide-react';
import { authApi, reportsApi } from '../lib/supabase';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Header() {
  const location = useLocation();
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await reportsApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return { title: 'Dashboard', icon: Map };
    if (path.includes('reports')) return { title: 'Reports', icon: AlertCircle };
    if (path.includes('teams')) return { title: 'Teams', icon: Users };
    if (path.includes('logistics')) return { title: 'Logistics', icon: BarChart3 };
    if (path.includes('analytics')) return { title: 'Analytics', icon: BarChart3 };
    return { title: 'Lifelines NGO', icon: Map };
  };

  const { title, icon: IconComponent } = getPageTitle();
  const resolvedPercent = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  const handleLogout = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return (
    <header style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1f2937',
      borderBottom: '3px solid #3B82F6',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
    }}>
      {/* Top bar with logo and navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1e40af 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '20px'
          }}>
            L
          </div>
          <div>
            <h1 style={{ margin: '0', color: 'white', fontSize: '22px', fontWeight: 'bold' }}>
              Lifelines
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
              Disaster Response Platform
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconComponent size={18} color='#60a5fa' style={{ marginRight: '4px' }} />
          <span style={{ color: '#e5e7eb', fontSize: '16px', fontWeight: '600' }}>
            {title}
          </span>
        </div>

        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#dc2626';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ef4444';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        padding: '12px 24px',
        backgroundColor: '#111827',
        borderTop: '1px solid #374151',
        alignItems: 'center'
      }}>
        {/* Total Reports */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>Total:</span>
          <span style={{ color: '#3B82F6', fontSize: '18px', fontWeight: 'bold' }}>{stats.total}</span>
        </div>

        {/* Pending */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          paddingLeft: '12px',
          borderLeft: '1px solid #374151'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#F59E0B'
          }} />
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>Pending:</span>
          <span style={{ color: '#F59E0B', fontSize: '14px', fontWeight: 'bold' }}>{stats.pending}</span>
        </div>

        {/* In Progress */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          paddingLeft: '12px',
          borderLeft: '1px solid #374151'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#3B82F6'
          }} />
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>In Progress:</span>
          <span style={{ color: '#3B82F6', fontSize: '14px', fontWeight: 'bold' }}>{stats.in_progress}</span>
        </div>

        {/* Resolved */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          paddingLeft: '12px',
          borderLeft: '1px solid #374151'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981'
          }} />
          <span style={{ color: '#9ca3af', fontSize: '11px' }}>Resolved:</span>
          <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>{stats.resolved}</span>
        </div>

        {/* Progress Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginLeft: 'auto',
          paddingLeft: '12px',
          borderLeft: '1px solid #374151'
        }}>
          <div style={{
            width: '120px',
            height: '6px',
            backgroundColor: '#374151',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${resolvedPercent}%`,
              backgroundColor: '#10b981',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ color: '#9ca3af', fontSize: '11px', minWidth: '32px' }}>
            {resolvedPercent}%
          </span>
        </div>
      </div>
    </header>
  );
}
