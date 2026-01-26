import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { RefreshCw, GripVertical, Send, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { reportsApi, teamsApi } from '../lib/supabase';

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

const GAZA_CENTER = [31.45, 34.45];

export default function Logistics() {
  const [reports, setReports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsData, teamsData] = await Promise.all([
        reportsApi.getAll(),
        teamsApi.getAll()
      ]);
      // Sort by priority (we'll add this field) or by status
      const sorted = reportsData.sort((a, b) => {
        const priorityOrder = { pending: 0, in_progress: 1, resolved: 2 };
        return (priorityOrder[a.status] || 0) - (priorityOrder[b.status] || 0);
      });
      setReports(sorted);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newReports = [...reports];
    const draggedReport = newReports[draggedItem];
    newReports.splice(draggedItem, 1);
    newReports.splice(index, 0, draggedReport);
    setReports(newReports);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDispatch = (report) => {
    setSelectedReport(report);
    setShowDispatchModal(true);
  };

  const sendSMS = (team) => {
    if (!selectedReport) return;
    
    const message = `DISPATCH: ${selectedReport.category?.replace('_', ' ').toUpperCase()} at coordinates ${selectedReport.latitude.toFixed(6)}, ${selectedReport.longitude.toFixed(6)}. Google Maps: https://maps.google.com/?q=${selectedReport.latitude},${selectedReport.longitude}`;
    
    // Open SMS app with pre-filled message
    window.open(`sms:${team.phone}?body=${encodeURIComponent(message)}`);
    
    // Update status to in_progress
    reportsApi.updateStatus(selectedReport.id, 'in_progress');
    setReports(reports.map(r => 
      r.id === selectedReport.id ? { ...r, status: 'in_progress' } : r
    ));
    
    setShowDispatchModal(false);
    alert(`SMS opened for ${team.name}. Status updated to In Progress.`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress': return <AlertCircle size={14} color="#3b82f6" />;
      case 'resolved': return <CheckCircle size={14} color="#10b981" />;
      default: return <Clock size={14} color="#f59e0b" />;
    }
  };

  return (
    <div className="logistics-layout">
      {/* Left Panel - Priority List */}
      <div className="logistics-list">
        <div className="logistics-list-header">
          <h3>Priority Queue</h3>
          <button className="btn btn-sm btn-secondary" onClick={fetchData}>
            <RefreshCw size={14} />
          </button>
        </div>
        <p className="logistics-hint">Drag to reorder priority</p>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="priority-list">
            {reports.filter(r => r.status !== 'resolved').map((report, index) => (
              <div
                key={report.id}
                className={`priority-item ${selectedReport?.id === report.id ? 'selected' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedReport(report)}
              >
                <div className="drag-handle">
                  <GripVertical size={16} />
                </div>
                <div className="priority-item-content">
                  <div className="priority-item-header">
                    <span className={`category-badge ${report.category}`}>
                      {report.category?.replace('_', ' ')}
                    </span>
                    {getStatusIcon(report.status)}
                  </div>
                  <div className="priority-item-location">
                    <MapPin size={12} />
                    {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                  </div>
                  <div className="priority-item-date">
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDispatch(report);
                  }}
                >
                  <Send size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Center - Map */}
      <div className="logistics-map">
        <MapContainer 
          center={GAZA_CENTER} 
          zoom={11} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={categoryIcons[report.category] || categoryIcons.unknown}
              eventHandlers={{
                click: () => {
                  setSelectedReport(report);
                }
              }}
            >
              <Popup>
                <div style={{ minWidth: 150 }}>
                  <strong style={{ textTransform: 'capitalize' }}>
                    {report.category?.replace('_', ' ')}
                  </strong>
                  <br />
                  <span className={`status-badge ${report.status || 'pending'}`} style={{ marginTop: 4, display: 'inline-block' }}>
                    {(report.status || 'pending').replace('_', ' ')}
                  </span>
                  <br /><br />
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleDispatch(report)}
                    style={{ width: '100%' }}
                  >
                    <Send size={12} /> Dispatch Team
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDispatchModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dispatch Team</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowDispatchModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="dispatch-info">
                <p><strong>Location:</strong></p>
                <p>{selectedReport.latitude?.toFixed(6)}, {selectedReport.longitude?.toFixed(6)}</p>
                <p style={{ marginTop: 8 }}><strong>Category:</strong> {selectedReport.category?.replace('_', ' ')}</p>
                <a 
                  href={`https://maps.google.com/?q=${selectedReport.latitude},${selectedReport.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ marginTop: 12 }}
                >
                  <MapPin size={14} /> Open in Google Maps
                </a>
              </div>
              
              <h4 style={{ marginTop: 20, marginBottom: 12 }}>Select Team to Dispatch:</h4>
              
              {teams.length === 0 ? (
                <p style={{ color: '#666' }}>No teams available. Add teams first.</p>
              ) : (
                <div className="teams-dispatch-list">
                  {teams.map((team) => (
                    <div key={team.id} className="team-dispatch-item">
                      <div>
                        <strong>{team.name}</strong>
                        <br />
                        <small>{team.phone}</small>
                      </div>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => sendSMS(team)}
                      >
                        <Send size={12} /> Send SMS
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
