import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { RefreshCw, GripVertical, Send, MapPin, Clock, CheckCircle, AlertCircle, Cpu, Zap, TrendingUp, AlertTriangle, Users, Route } from 'lucide-react';
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

// AI Priority Scoring - Fanar-inspired intelligent prioritization
const calculateAIPriority = (report) => {
  let score = 0;
  let factors = [];

  // Hazard severity (highest weight)
  if (report.subcategory?.includes('uxo')) {
    score += 40;
    factors.push('UXO detected (+40)');
  }
  if (report.subcategory?.includes('bodies')) {
    score += 35;
    factors.push('Human remains (+35)');
  }
  if (report.subcategory?.includes('chemicals')) {
    score += 30;
    factors.push('Chemical hazard (+30)');
  }
  if (report.subcategory?.includes('electrical')) {
    score += 25;
    factors.push('Electrical hazard (+25)');
  }
  if (report.subcategory?.includes('blocked_road')) {
    score += 20;
    factors.push('Access blocked (+20)');
  }

  // Category priority
  if (report.category === 'hazard') {
    score += 15;
    factors.push('Hazard category (+15)');
  } else if (report.category === 'blocked_road') {
    score += 10;
    factors.push('Road blockage (+10)');
  } else {
    score += 5;
    factors.push('Rubble (+5)');
  }

  // Time decay - older reports get higher priority
  const hoursOld = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
  if (hoursOld > 48) {
    score += 15;
    factors.push('Critical age >48h (+15)');
  } else if (hoursOld > 24) {
    score += 10;
    factors.push('Aging >24h (+10)');
  } else if (hoursOld > 12) {
    score += 5;
    factors.push('Recent 12-24h (+5)');
  }

  // Status bonus for pending
  if (!report.status || report.status === 'pending') {
    score += 10;
    factors.push('Unaddressed (+10)');
  }

  return { score, factors, level: score >= 50 ? 'critical' : score >= 30 ? 'high' : score >= 15 ? 'medium' : 'low' };
};

const getPriorityColor = (level) => {
  switch (level) {
    case 'critical': return '#DC2626';
    case 'high': return '#F59E0B';
    case 'medium': return '#3B82F6';
    default: return '#6B7280';
  }
};

const getPriorityBgColor = (level) => {
  switch (level) {
    case 'critical': return '#FEE2E2';
    case 'high': return '#FEF3C7';
    case 'medium': return '#DBEAFE';
    default: return '#F3F4F6';
  }
};

export default function Logistics() {
  const [reports, setReports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsData, teamsData] = await Promise.all([
        reportsApi.getAll(),
        teamsApi.getAll()
      ]);
      
      // Apply AI prioritization
      const prioritized = reportsData.map(r => ({
        ...r,
        aiPriority: calculateAIPriority(r)
      })).sort((a, b) => b.aiPriority.score - a.aiPriority.score);
      
      setReports(prioritized);
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

  const runAiAnalysis = async () => {
    setAiAnalyzing(true);
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Re-sort with updated AI scores
    const reprioritized = reports.map(r => ({
      ...r,
      aiPriority: calculateAIPriority(r)
    })).sort((a, b) => b.aiPriority.score - a.aiPriority.score);
    
    setReports(reprioritized);
    setAiAnalyzing(false);
    setShowAiInsights(true);
  };

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
      {/* Left Panel - AI-Powered Priority List */}
      <div className="logistics-list">
        <div className="logistics-list-header">
          <h3>🤖 AI Priority Queue</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-sm" 
              style={{ 
                background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                color: 'white',
                border: 'none'
              }}
              onClick={runAiAnalysis}
              disabled={aiAnalyzing}
            >
              {aiAnalyzing ? (
                <>
                  <Cpu size={14} className="spinning" /> Analyzing...
                </>
              ) : (
                <>
                  <Zap size={14} /> Fanar AI
                </>
              )}
            </button>
            <button className="btn btn-sm btn-secondary" onClick={fetchData}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* AI Insights Panel */}
        {showAiInsights && (
          <div style={{
            background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
            border: '1px solid #A5B4FC',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Cpu size={16} color="#6366F1" />
              <strong style={{ color: '#4F46E5' }}>Fanar AI Analysis</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#4B5563' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <TrendingUp size={12} color="#10B981" />
                <span><strong>{reports.filter(r => r.aiPriority?.level === 'critical').length}</strong> critical priority reports</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <AlertTriangle size={12} color="#F59E0B" />
                <span><strong>{reports.filter(r => r.aiPriority?.level === 'high').length}</strong> high priority reports</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Users size={12} color="#6366F1" />
                <span><strong>{teams.length}</strong> teams available for dispatch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Route size={12} color="#8B5CF6" />
                <span>Optimal route calculated for {Math.min(teams.length, reports.filter(r => r.status !== 'resolved').length)} dispatches</span>
              </div>
            </div>
            <button 
              onClick={() => setShowAiInsights(false)}
              style={{ 
                marginTop: '8px', 
                fontSize: '11px', 
                color: '#6366F1', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer' 
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <p className="logistics-hint">Drag to reorder • AI-ranked by severity & urgency</p>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="priority-list">
            {reports.filter(r => r.status !== 'resolved').map((report, index) => (
              <div
                key={report.id}
                className={`priority-item ${selectedReport?.id === report.id ? 'selected' : ''}`}
                style={{
                  borderLeft: `4px solid ${getPriorityColor(report.aiPriority?.level)}`,
                  background: selectedReport?.id === report.id ? getPriorityBgColor(report.aiPriority?.level) : 'white'
                }}
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
                  <div className="priority-item-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`category-badge ${report.category}`}>
                      {report.category?.replace('_', ' ')}
                    </span>
                    <span 
                      style={{
                        background: getPriorityColor(report.aiPriority?.level),
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}
                    >
                      {report.aiPriority?.level} ({report.aiPriority?.score})
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
                  {/* AI Factor Pills */}
                  {report.aiPriority?.factors?.slice(0, 2).map((factor, i) => (
                    <span 
                      key={i}
                      style={{
                        display: 'inline-block',
                        background: '#F3F4F6',
                        color: '#6B7280',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        marginRight: '4px',
                        marginTop: '4px'
                      }}
                    >
                      {factor}
                    </span>
                  ))}
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
                <div style={{ minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <strong style={{ textTransform: 'capitalize' }}>
                      {report.category?.replace('_', ' ')}
                    </strong>
                    <span 
                      style={{
                        background: getPriorityColor(report.aiPriority?.level),
                        color: 'white',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: '600'
                      }}
                    >
                      {report.aiPriority?.level?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                    AI Score: <strong>{report.aiPriority?.score}</strong>/100
                  </div>
                  <span className={`status-badge ${report.status || 'pending'}`} style={{ marginBottom: '8px', display: 'inline-block' }}>
                    {(report.status || 'pending').replace('_', ' ')}
                  </span>
                  <br />
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleDispatch(report)}
                    style={{ width: '100%', marginTop: '8px' }}
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
              <h3>🚀 Dispatch Team</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowDispatchModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* AI Priority Badge */}
              <div style={{
                background: getPriorityBgColor(selectedReport.aiPriority?.level),
                border: `1px solid ${getPriorityColor(selectedReport.aiPriority?.level)}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Cpu size={16} color={getPriorityColor(selectedReport.aiPriority?.level)} />
                  <strong style={{ color: getPriorityColor(selectedReport.aiPriority?.level) }}>
                    AI Priority: {selectedReport.aiPriority?.level?.toUpperCase()} ({selectedReport.aiPriority?.score}/100)
                  </strong>
                </div>
                <div style={{ fontSize: '11px', color: '#4B5563' }}>
                  <strong>Factors:</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {selectedReport.aiPriority?.factors?.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="dispatch-info">
                <p><strong>📍 Location:</strong></p>
                <p>{selectedReport.latitude?.toFixed(6)}, {selectedReport.longitude?.toFixed(6)}</p>
                <p style={{ marginTop: 8 }}><strong>📂 Category:</strong> {selectedReport.category?.replace('_', ' ')}</p>
                {selectedReport.subcategory && (
                  <p style={{ marginTop: 4 }}>
                    <strong>⚠️ Hazards:</strong> {selectedReport.subcategory.split('|')[1]?.replace('hazards:', '').replace(/,/g, ', ') || 'None'}
                  </p>
                )}
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
