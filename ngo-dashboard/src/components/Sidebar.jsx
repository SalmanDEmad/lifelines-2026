import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Truck, BarChart3, Download } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Amal</h1>
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
