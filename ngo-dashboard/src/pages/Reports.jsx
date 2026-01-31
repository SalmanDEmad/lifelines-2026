import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { reportsApi, votingApi } from '../lib/supabase';
import { getTwemojiUrl, VOTE_EMOJIS } from '../lib/emoji';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [voteStats, setVoteStats] = useState(null);
  const [votesLoading, setVotesLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getAll();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      console.log('[INFO] Changing status for report:', { id, newStatus });
      await reportsApi.updateStatus(id, newStatus);
      console.log('[SUCCESS] Status changed, updating UI');
      setReports(reports.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));
      if (selectedReport?.id === id) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + (error.message || error.toString()));
    }
  };

  const loadVotingStats = async (reportId) => {
    try {
      setVotesLoading(true);
      const stats = await votingApi.getVoteStats(reportId);
      setVoteStats(stats);
    } catch (error) {
      console.error('Error loading vote stats:', error);
      setVoteStats(null);
    } finally {
      setVotesLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await reportsApi.delete(id);
      setReports(reports.filter(r => r.id !== id));
      setSelectedReport(null);
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => (r.status || 'pending') === filter);

  const StatusButton = ({ status, currentStatus, onClick }) => {
    const icons = {
      pending: <Clock size={14} />,
      in_progress: <AlertCircle size={14} />,
      resolved: <CheckCircle size={14} />,
    };
    
    const isActive = currentStatus === status || (!currentStatus && status === 'pending');
    
    return (
      <button
        className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onClick(status)}
        style={{ textTransform: 'capitalize' }}
      >
        {icons[status]}
        {status.replace('_', ' ')}
      </button>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2>Reports</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button className="btn btn-primary" onClick={fetchReports} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="reports-table-container">
        {loading ? (
          <div className="loading">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <h4>No reports found</h4>
            <p>No reports match the current filter.</p>
          </div>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Location</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <span className={`category-badge ${report.category}`}>
                      {report.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}
                  </td>
                  <td>{report.zone || '-'}</td>
                  <td>
                    <span className={`status-badge ${report.status || 'pending'}`}>
                      {(report.status || 'pending').replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setSelectedReport(report);
                          loadVotingStats(report.id);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(report.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', padding: '16px 20px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`category-badge ${selectedReport.category}`} style={{ margin: 0 }}>
                  {selectedReport.category?.replace('_', ' ')}
                </span>
                <span style={{ color: '#666', fontSize: '13px' }}>
                  {selectedReport.zone || 'Unknown Zone'}
                </span>
              </div>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedReport(null)}
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '12px 20px 20px', display: 'flex', gap: '20px' }}>
              {/* Left: Image */}
              <div style={{ flex: '0 0 340px' }}>
                {selectedReport.image_url ? (
                  <img 
                    src={selectedReport.image_url} 
                    alt="Report" 
                    style={{ 
                      width: '100%', 
                      height: '280px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      background: '#f0f0f0'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{ 
                  display: selectedReport.image_url ? 'none' : 'flex',
                  width: '100%', 
                  height: '280px', 
                  background: '#f5f5f5', 
                  borderRadius: '8px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '13px'
                }}>
                  No image available
                </div>

                {/* Location below image */}
                <div style={{ marginTop: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#666' }}>Coordinates</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {selectedReport.latitude?.toFixed(5)}, {selectedReport.longitude?.toFixed(5)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Reported</span>
                    <span>{new Date(selectedReport.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Right: Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Status Row */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <StatusButton 
                      status="pending" 
                      currentStatus={selectedReport.status}
                      onClick={(s) => handleStatusChange(selectedReport.id, s)}
                    />
                    <StatusButton 
                      status="in_progress" 
                      currentStatus={selectedReport.status}
                      onClick={(s) => handleStatusChange(selectedReport.id, s)}
                    />
                    <StatusButton 
                      status="resolved" 
                      currentStatus={selectedReport.status}
                      onClick={(s) => handleStatusChange(selectedReport.id, s)}
                    />
                  </div>
                </div>

                {/* Materials & Hazards in compact rows */}
                {selectedReport.subcategory && selectedReport.subcategory.includes('materials:') && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Materials</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {selectedReport.subcategory.split('|')[0]?.replace('materials:', '').split(',').map((material, idx) => (
                        <span 
                          key={idx}
                          style={{ 
                            background: '#e0edff', 
                            color: '#2563eb', 
                            padding: '3px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}
                        >
                          {material.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReport.subcategory && selectedReport.subcategory.includes('hazards:') && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠️ Hazards</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {selectedReport.subcategory.split('|').find(p => p.startsWith('hazards:'))?.replace('hazards:', '').split(',').map((hazard, idx) => {
                        const hazardConfig = {
                          uxo: { bg: '#fee2e2', color: '#dc2626', label: 'UXOs' },
                          bodies: { bg: '#ede9fe', color: '#7c3aed', label: 'Human Remains' },
                          chemicals: { bg: '#fef3c7', color: '#d97706', label: 'Chemicals' },
                          electrical: { bg: '#fee2e2', color: '#dc2626', label: 'Electrical' },
                          blocked_road: { bg: '#fef3c7', color: '#92400e', label: 'Blocked Road' }
                        };
                        const config = hazardConfig[hazard.trim()] || { bg: '#f3f4f6', color: '#6b7280', label: hazard.trim() };
                        return (
                          <span 
                            key={idx}
                            style={{ 
                              background: config.bg, 
                              color: config.color, 
                              padding: '3px 8px', 
                              borderRadius: '4px', 
                              fontSize: '11px',
                              fontWeight: '500'
                            }}
                          >
                            {config.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedReport.description && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</div>
                    <p style={{ 
                      margin: 0, 
                      padding: '8px 10px', 
                      background: '#f8f9fa', 
                      borderRadius: '6px', 
                      fontSize: '13px',
                      lineHeight: '1.4',
                      color: '#374151'
                    }}>
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                {/* Voting - Compact */}
                <div style={{ marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🗳️ Community Consensus
                  </div>
                  {votesLoading ? (
                    <div style={{ color: '#999', fontSize: '12px' }}>Loading...</div>
                  ) : voteStats ? (
                    <div>
                      {/* Accuracy bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#e5e5e5', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${voteStats.accuracyPercentage}%`, background: '#10B981', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#10B981', minWidth: '40px' }}>
                          {voteStats.accuracyPercentage}%
                        </span>
                      </div>
                      {/* Vote counts inline */}
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                        <span style={{ color: '#10b981' }}>✓ {voteStats.accurateVotes}</span>
                        <span style={{ color: '#ef4444' }}>✗ {voteStats.inaccurateVotes}</span>
                        <span style={{ color: '#f59e0b' }}>? {voteStats.unclearVotes}</span>
                        <span style={{ color: '#666', marginLeft: 'auto' }}>{voteStats.totalVotes} votes</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#999', fontSize: '12px' }}>No votes yet</div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #eee', padding: '12px 20px' }}>
              <button 
                className="btn btn-danger"
                onClick={() => handleDelete(selectedReport.id)}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                Delete
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedReport(null)}
                style={{ padding: '6px 16px', fontSize: '13px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
