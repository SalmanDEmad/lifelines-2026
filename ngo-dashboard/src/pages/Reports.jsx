import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { reportsApi } from '../lib/supabase';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');

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
      await reportsApi.updateStatus(id, newStatus);
      setReports(reports.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));
      if (selectedReport?.id === id) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
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
                        onClick={() => setSelectedReport(report)}
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Details</h3>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedReport(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {selectedReport.image_url && (
                <img 
                  src={selectedReport.image_url} 
                  alt="Report" 
                  className="report-image"
                />
              )}
              
              <div className="form-group">
                <label>Category</label>
                <p>
                  <span className={`category-badge ${selectedReport.category}`}>
                    {selectedReport.category?.replace('_', ' ')}
                  </span>
                </p>
              </div>

              <div className="form-group">
                <label>Location</label>
                <p>
                  {selectedReport.latitude?.toFixed(6)}, {selectedReport.longitude?.toFixed(6)}
                  <br />
                  <small style={{ color: '#666' }}>Zone: {selectedReport.zone || 'Unknown'}</small>
                </p>
              </div>

              {selectedReport.description && (
                <div className="form-group">
                  <label>Description</label>
                  <p>{selectedReport.description}</p>
                </div>
              )}

              <div className="form-group">
                <label>Reported</label>
                <p>{new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>

              <div className="form-group">
                <label>Status</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-danger"
                onClick={() => {
                  handleDelete(selectedReport.id);
                }}
              >
                <Trash2 size={16} />
                Delete Report
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedReport(null)}
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
