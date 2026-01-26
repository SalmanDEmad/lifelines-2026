import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, LogOut, Truck } from 'lucide-react';

export default function Sidebar({ onSignOut }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Lifelines</h1>
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
      </nav>
      
      <div style={{ marginTop: 'auto', padding: '20px 0' }}>
        <button className="nav-item" onClick={onSignOut}>
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
