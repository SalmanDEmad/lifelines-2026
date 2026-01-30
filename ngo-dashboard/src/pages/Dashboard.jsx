import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { RefreshCw, AlertCircle, MapPin, AlertTriangle, Construction, Globe, Plus, Download, FileText } from 'lucide-react';
import { reportsApi } from '../lib/supabase';
import { getTwemojiUrl, CATEGORY_EMOJIS } from '../lib/emoji';
import { exportToCSV, exportToPDF } from '../lib/export';
import Supercluster from 'supercluster';

// Region configurations with center coordinates and Twemoji flags
const REGIONS = {
  all: { name: 'All Regions', flag: '🌍', flagUrl: getTwemojiUrl('🌍'), center: [25, 40], zoom: 3 },
  palestine: { name: 'Palestine', flag: '🇵🇸', flagUrl: getTwemojiUrl('🇵🇸'), center: [31.45, 34.40], zoom: 11 },
  sudan: { name: 'Sudan', flag: '🇸🇩', flagUrl: getTwemojiUrl('🇸🇩'), center: [15.55, 32.53], zoom: 6 },
  yemen: { name: 'Yemen', flag: '🇾🇪', flagUrl: getTwemojiUrl('🇾🇪'), center: [15.37, 44.19], zoom: 7 },
  syria: { name: 'Syria', flag: '🇸🇾', flagUrl: getTwemojiUrl('🇸🇾'), center: [35.0, 38.0], zoom: 7 },
  ukraine: { name: 'Ukraine', flag: '🇺🇦', flagUrl: getTwemojiUrl('🇺🇦'), center: [48.38, 37.62], zoom: 6 },
  afghanistan: { name: 'Afghanistan', flag: '🇦🇫', flagUrl: getTwemojiUrl('🇦🇫'), center: [34.52, 69.17], zoom: 6 },
  lebanon: { name: 'Lebanon', flag: '🇱🇧', flagUrl: getTwemojiUrl('🇱🇧'), center: [33.89, 35.50], zoom: 9 },
  somalia: { name: 'Somalia', flag: '🇸🇴', flagUrl: getTwemojiUrl('🇸🇴'), center: [2.05, 45.34], zoom: 6 },
};

// Demo reports for all regions
const DEMO_REPORTS = {
  palestine: [
    { id: 'demo-p1', zone: 'Gaza City', category: 'rubble', latitude: 31.5150, longitude: 34.4500, description: 'Collapsed residential building - 3 floors', status: 'pending' },
    { id: 'demo-p2', zone: 'Gaza City', category: 'hazard', latitude: 31.5080, longitude: 34.4650, description: 'Unexploded ordnance reported near school', status: 'pending' },
    { id: 'demo-p3', zone: 'Gaza City', category: 'blocked_road', latitude: 31.5200, longitude: 34.4400, description: 'Main road blocked by debris', status: 'in_progress' },
    { id: 'demo-p4', zone: 'North Gaza', category: 'rubble', latitude: 31.5500, longitude: 34.4900, description: 'Multiple buildings collapsed in Beit Hanoun', status: 'pending' },
    { id: 'demo-p5', zone: 'Khan Younis', category: 'rubble', latitude: 31.3500, longitude: 34.3000, description: 'Market area heavily damaged', status: 'pending' },
    { id: 'demo-p6', zone: 'Rafah', category: 'blocked_road', latitude: 31.2900, longitude: 34.2600, description: 'Evacuation route blocked by rubble', status: 'in_progress' },
  ],
  ukraine: [
    { id: 'demo-u1', zone: 'Kyiv', category: 'rubble', latitude: 50.4500, longitude: 30.5200, description: 'Apartment complex hit by missile', status: 'pending' },
    { id: 'demo-u2', zone: 'Kyiv', category: 'hazard', latitude: 50.4300, longitude: 30.5500, description: 'Unexploded missile in residential area', status: 'pending' },
    { id: 'demo-u3', zone: 'Kharkiv', category: 'rubble', latitude: 50.0000, longitude: 36.2500, description: 'University building destroyed', status: 'in_progress' },
    { id: 'demo-u4', zone: 'Mariupol', category: 'rubble', latitude: 47.1000, longitude: 37.5500, description: 'Theater shelter destroyed', status: 'pending' },
    { id: 'demo-u5', zone: 'Bakhmut', category: 'rubble', latitude: 48.6000, longitude: 38.0000, description: 'City center completely leveled', status: 'pending' },
  ],
  syria: [
    { id: 'demo-s1', zone: 'Aleppo', category: 'rubble', latitude: 36.2000, longitude: 37.1500, description: 'Historic souk completely destroyed', status: 'pending' },
    { id: 'demo-s2', zone: 'Aleppo', category: 'hazard', latitude: 36.1800, longitude: 37.1700, description: 'Chemical contamination suspected', status: 'pending' },
    { id: 'demo-s3', zone: 'Damascus', category: 'rubble', latitude: 33.5200, longitude: 36.3000, description: 'Suburb heavily bombed', status: 'in_progress' },
    { id: 'demo-s4', zone: 'Idlib', category: 'rubble', latitude: 35.9500, longitude: 36.6500, description: 'Last hospital in area destroyed', status: 'pending' },
  ],
  yemen: [
    { id: 'demo-y1', zone: 'Sanaa', category: 'rubble', latitude: 15.3700, longitude: 44.1900, description: 'Historic old city buildings damaged', status: 'pending' },
    { id: 'demo-y2', zone: 'Sanaa', category: 'hazard', latitude: 15.3500, longitude: 44.2100, description: 'Hospital without power - medical emergency', status: 'pending' },
    { id: 'demo-y3', zone: 'Aden', category: 'rubble', latitude: 12.8000, longitude: 45.0000, description: 'Port facilities heavily damaged', status: 'in_progress' },
    { id: 'demo-y4', zone: 'Taiz', category: 'rubble', latitude: 13.5800, longitude: 44.0500, description: 'City center in ruins from siege', status: 'pending' },
  ],
  sudan: [
    { id: 'demo-sd1', zone: 'Khartoum', category: 'rubble', latitude: 15.5900, longitude: 32.5400, description: 'Government building collapsed from shelling', status: 'pending' },
    { id: 'demo-sd2', zone: 'Khartoum', category: 'hazard', latitude: 15.5700, longitude: 32.5200, description: 'Armed conflict zone - avoid area', status: 'pending' },
    { id: 'demo-sd3', zone: 'Omdurman', category: 'rubble', latitude: 15.6500, longitude: 32.4800, description: 'Residential area severely damaged', status: 'in_progress' },
  ],
  afghanistan: [
    { id: 'demo-a1', zone: 'Kabul', category: 'rubble', latitude: 34.5200, longitude: 69.1700, description: 'Mosque destroyed in explosion', status: 'pending' },
    { id: 'demo-a2', zone: 'Kabul', category: 'hazard', latitude: 34.5000, longitude: 69.2000, description: 'IED suspected near market', status: 'pending' },
    { id: 'demo-a3', zone: 'Kandahar', category: 'rubble', latitude: 31.6200, longitude: 65.7200, description: 'Airstrike damage to civilian homes', status: 'in_progress' },
  ],
  lebanon: [
    { id: 'demo-l1', zone: 'Beirut', category: 'rubble', latitude: 33.8900, longitude: 35.5000, description: 'Port explosion aftermath - buildings unstable', status: 'pending' },
    { id: 'demo-l2', zone: 'Beirut', category: 'hazard', latitude: 33.8700, longitude: 35.5200, description: 'Toxic chemical residue from port blast', status: 'pending' },
    { id: 'demo-l3', zone: 'South Lebanon', category: 'rubble', latitude: 33.1500, longitude: 35.4000, description: 'Village destroyed by airstrikes', status: 'in_progress' },
  ],
  somalia: [
    { id: 'demo-so1', zone: 'Mogadishu', category: 'rubble', latitude: 2.0500, longitude: 45.3500, description: 'Market destroyed by car bomb', status: 'pending' },
    { id: 'demo-so2', zone: 'Mogadishu', category: 'hazard', latitude: 2.0300, longitude: 45.3700, description: 'Al-Shabaab controlled area', status: 'pending' },
    { id: 'demo-so3', zone: 'Baidoa', category: 'hazard', latitude: 3.1500, longitude: 43.6500, description: 'Drought zone - famine conditions', status: 'in_progress' },
  ],
};

// Category colors and icons with Twemoji
const getCategoryStyle = (category) => {
  switch (category) {
    case 'rubble':
      return { color: '#EF4444', emoji: '🧱', emojiUrl: getTwemojiUrl('🧱'), label: 'Rubble' };
    case 'hazard':
      return { color: '#F59E0B', emoji: '⚠️', emojiUrl: getTwemojiUrl('⚠️'), label: 'Hazard' };
    case 'blocked_road':
      return { color: '#3B82F6', emoji: '🚧', emojiUrl: getTwemojiUrl('🚧'), label: 'Blocked Road' };
    default:
      return { color: '#6B7280', emoji: '📍', emojiUrl: getTwemojiUrl('📍'), label: 'Report' };
  }
};

// Create custom marker icon based on category with Twemoji
const createCategoryIcon = (category) => {
  const style = getCategoryStyle(category);
  return divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${style.color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    "><img src="${style.emojiUrl}" alt="${style.emoji}" style="width: 18px; height: 18px;" /></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Map center updater component
function MapCenterUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ 
    total: 0, 
    pending: 0, 
    in_progress: 0, 
    resolved: 0 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showDemoData, setShowDemoData] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // Delete report from Supabase
  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(reportId);
      const response = await reportsApi.delete(`/reports/${reportId}`);
      
      if (response.ok || response.status === 204) {
        // Remove from state
        setReports(reports.filter(r => r.id !== reportId));
      } else {
        alert('Failed to delete report: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting report: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  // Get combined reports (Supabase + demo if enabled)
  const getAllDemoReports = () => {
    if (selectedRegion === 'all') {
      // Combine all demo reports from all regions
      return Object.values(DEMO_REPORTS).flat();
    }
    return DEMO_REPORTS[selectedRegion] || [];
  };
  
  const displayReports = showDemoData 
    ? [...reports, ...getAllDemoReports()]
    : reports;

  // Filter reports by selected region's zones
  const regionReports = selectedRegion === 'all' 
    ? displayReports // Show all reports when 'all' is selected
    : displayReports.filter(r => {
        // Check if report belongs to selected region based on coordinates
        const region = REGIONS[selectedRegion];
        if (!region || !r.latitude || !r.longitude) return false;
        
        // Simple bounding box check (approximate)
        const [centerLat, centerLng] = region.center;
        const latDiff = Math.abs(r.latitude - centerLat);
        const lngDiff = Math.abs(r.longitude - centerLng);
        
        // Allow reports within reasonable distance of region center
        const maxDist = selectedRegion === 'palestine' ? 0.5 : 10;
        return latDiff < maxDist && lngDiff < maxDist;
      });

  // Calculate stats from displayed reports
  const displayStats = {
    total: regionReports.length,
    pending: regionReports.filter(r => r.status === 'pending' || !r.status).length,
    in_progress: regionReports.filter(r => r.status === 'in_progress').length,
    resolved: regionReports.filter(r => r.status === 'resolved').length,
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch with timeout
      const reportsPromise = reportsApi.getAll();
      const statsPromise = reportsApi.getStats();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );

      const [data, statsData] = await Promise.all([
        Promise.race([reportsPromise, timeoutPromise]),
        Promise.race([statsPromise, timeoutPromise])
      ]);

      setReports(data || []);
      setStats(statsData || { total: 0, pending: 0, in_progress: 0, resolved: 0 });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
      // Set dummy data for demo
      setStats({ total: 5, pending: 2, in_progress: 1, resolved: 2 });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Region Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} color="#6b7280" />
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {Object.entries(REGIONS).map(([key, region]) => (
                <option key={key} value={key}>
                  {region.flag} {region.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Demo Data Toggle */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '13px',
            color: '#6b7280',
            cursor: 'pointer',
          }}>
            <input 
              type="checkbox" 
              checked={showDemoData}
              onChange={(e) => setShowDemoData(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Show Demo Data
          </label>
          
          <button 
            className="btn btn-primary" 
            onClick={fetchData} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Export Buttons */}
          <button 
            className="btn btn-secondary"
            onClick={() => exportToCSV(regionReports, `lifelines_${selectedRegion}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Export to CSV"
          >
            <Download size={16} />
            CSV
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => exportToPDF(regionReports, `lifelines_${selectedRegion}`, { 
              region: REGIONS[selectedRegion]?.name || 'All Regions' 
            })}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Export to PDF"
          >
            <FileText size={16} />
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          margin: '20px',
          borderRadius: '6px',
          color: '#991b1b',
          border: '1px solid #fecaca',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontWeight: '600', marginBottom: '4px' }}>Error loading data</p>
            <p style={{ fontSize: '14px', margin: '0' }}>{error}</p>
            <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '8px 0 0 0' }}>
              Showing sample data. Check console for details.
            </p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="label">Total Reports</div>
          <div className="value">{displayStats.total}</div>
        </div>
        <div className="stat-card pending">
          <div className="label">Pending</div>
          <div className="value">{displayStats.pending}</div>
        </div>
        <div className="stat-card progress">
          <div className="label">In Progress</div>
          <div className="value">{displayStats.in_progress}</div>
        </div>
        <div className="stat-card resolved">
          <div className="label">Resolved</div>
          <div className="value">{displayStats.resolved}</div>
        </div>
      </div>

      {/* Map - Always show, even without reports */}
      <div style={{ marginTop: '30px', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Report Locations</h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
              Rubble
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
              Hazard
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></span>
              Blocked Road
            </span>
          </div>
        </div>
        <div style={{
          height: '500px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <MapContainer
            center={REGIONS[selectedRegion]?.center || [31.5, 34.45]}
            zoom={REGIONS[selectedRegion]?.zoom || 10}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <MapCenterUpdater 
              center={REGIONS[selectedRegion]?.center || [31.5, 34.45]} 
              zoom={REGIONS[selectedRegion]?.zoom || 10}
            />
            {regionReports.map((report) => {
              const lat = report.latitude;
              const lng = report.longitude;
              if (!lat || !lng) return null;
              
              const style = getCategoryStyle(report.category);
              
              return (
                <Marker 
                  key={report.id} 
                  position={[lat, lng]} 
                  icon={createCategoryIcon(report.category)}
                >
                  <Popup>
                    <div style={{ fontSize: '13px', minWidth: '200px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '8px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <span style={{ fontSize: '20px' }}>{style.emoji}</span>
                        <strong style={{ fontSize: '15px' }}>{style.label}</strong>
                      </div>
                      <p style={{ margin: '4px 0', color: '#374151' }}>
                        <strong>Zone:</strong> {report.zone || 'Unknown'}
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Status:</strong>{' '}
                        <span style={{ 
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: 
                            report.status === 'resolved' ? '#d1fae5' :
                            report.status === 'in_progress' ? '#fef3c7' : '#fee2e2',
                          color:
                            report.status === 'resolved' ? '#065f46' :
                            report.status === 'in_progress' ? '#92400e' : '#991b1b'
                        }}>
                          {report.status || 'pending'}
                        </span>
                      </p>
                      {report.description && (
                        <p style={{ margin: '8px 0 4px', color: '#6b7280', fontSize: '12px' }}>
                          {report.description}
                        </p>
                      )}
                      <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '11px' }}>
                        <img src={getTwemojiUrl('📍')} alt="📍" style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginRight: '4px' }} />
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                      </p>
                      {report.created_at && (
                        <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '11px' }}>
                          <img src={getTwemojiUrl('🕐')} alt="🕐" style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginRight: '4px' }} />
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
        {regionReports.length === 0 && !showDemoData && (
          <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '16px' }}>
            No reports to display on map. Enable demo data or wait for reports from mobile app.
          </p>
        )}
      </div>

      {/* Reports Table */}
      <div className="reports-table-container" style={{ marginTop: '30px' }}>
        <h3>Recent Reports ({regionReports.length})</h3>
        {regionReports.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            color: '#666'
          }}>
            <p style={{ margin: '0', fontSize: '16px' }}>
              {error ? 'No data available' : 'No reports yet'}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              {error ? 'Check your connection and try again' : 'Enable demo data or reports will appear when synced'}
            </p>
          </div>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Description</th>
                <th style={{ width: '80px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {regionReports.slice(0, 15).map((report) => {
                const style = getCategoryStyle(report.category);
                return (
                  <tr key={report.id}>
                    <td>{report.zone || 'Unknown'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src={style.emojiUrl} alt={style.emoji} style={{ width: '14px', height: '14px' }} />
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: style.color
                        }}></span>
                        {style.label}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: 
                          report.status === 'resolved' ? '#d1fae5' :
                          report.status === 'in_progress' ? '#fef3c7' :
                          '#fee2e2',
                        color:
                          report.status === 'resolved' ? '#065f46' :
                          report.status === 'in_progress' ? '#92400e' :
                          '#991b1b'
                      }}>
                        {report.status || 'pending'}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#666' }}>
                      {report.created_at 
                        ? new Date(report.created_at).toLocaleDateString()
                        : '-'
                      }
                    </td>
                    <td style={{ fontSize: '13px', color: '#666' }}>
                      {report.description?.substring(0, 40) || '-'}
                      {report.description?.length > 40 ? '...' : ''}
                    </td>
                    <td>
                      {!report.id.startsWith('demo-') && (
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deleting === report.id}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: deleting === report.id ? 'wait' : 'pointer',
                            opacity: deleting === report.id ? 0.6 : 1
                          }}
                        >
                          {deleting === report.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
