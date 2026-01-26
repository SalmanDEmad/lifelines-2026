import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { RefreshCw } from 'lucide-react';
import { reportsApi } from '../lib/supabase';

// Custom marker icons
const createIcon = (color) => new Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const categoryIcons = {
  rubble: createIcon('red'),
  hazard: createIcon('orange'),
  blocked_road: createIcon('violet'),
  unknown: createIcon('grey'),
};

const statusColors = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#10b981',
};

// Gaza center
const GAZA_CENTER = [31.45, 34.45];

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsData, statsData] = await Promise.all([
        reportsApi.getAll(),
        reportsApi.getStats()
      ]);
      setReports(reportsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <button className="btn btn-primary" onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="label">Total Reports</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat-card pending">
          <div className="label">Pending</div>
          <div className="value">{stats.pending}</div>
        </div>
        <div className="stat-card progress">
          <div className="label">In Progress</div>
          <div className="value">{stats.in_progress}</div>
        </div>
        <div className="stat-card resolved">
          <div className="label">Resolved</div>
          <div className="value">{stats.resolved}</div>
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <MapContainer 
          center={GAZA_CENTER} 
          zoom={11} 
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={categoryIcons[report.category] || categoryIcons.unknown}
            >
              <Popup>
                <div>
                  <strong style={{ textTransform: 'capitalize' }}>
                    {report.category?.replace('_', ' ')}
                  </strong>
                  <br />
                  <span 
                    style={{ 
                      color: statusColors[report.status] || statusColors.pending,
                      fontWeight: 500 
                    }}
                  >
                    {(report.status || 'pending').replace('_', ' ')}
                  </span>
                  <br />
                  <small>
                    {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                  </small>
                  {report.description && (
                    <>
                      <br />
                      <small>{report.description}</small>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Recent Reports */}
      <div className="reports-table-container">
        <div className="table-header">
          <h3>Recent Reports</h3>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <h4>No reports yet</h4>
            <p>Reports from civilians will appear here.</p>
          </div>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.slice(0, 5).map((report) => (
                <tr key={report.id}>
                  <td>
                    <span className={`category-badge ${report.category}`}>
                      {report.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                  </td>
                  <td>
                    <span className={`status-badge ${report.status || 'pending'}`}>
                      {(report.status || 'pending').replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
