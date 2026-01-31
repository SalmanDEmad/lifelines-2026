import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Truck, BarChart3, Download } from 'lucide-react';

// Logo URL - using a placeholder that shows the Amal branding
const LOGO_URL = 'https://i.imgur.com/YqZQZQZ.png'; // Fallback, will use text if fails

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white'
          }}>أ</div>
          <div>
            <h1 style={{ margin: 0 }}>Amal أمل</h1>
            <p style={{ margin: 0, fontSize: '10px', opacity: 0.7 }}>Mapping Gaza's Debris</p>
          </div>
        </div>
        <p>NGO Dashboard</p>
      </div>
      
      <nav>
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        
        <NavLink 
          to="/reports" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={20} />
          Reports
        </NavLink>

        <NavLink 
          to="/logistics" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Truck size={20} />
          Logistics
        </NavLink>
        
        <NavLink 
          to="/teams" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          Teams
        </NavLink>

        <NavLink 
          to="/analytics" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={20} />
          Analytics
        </NavLink>
      </nav>
    </aside>
  );
}
