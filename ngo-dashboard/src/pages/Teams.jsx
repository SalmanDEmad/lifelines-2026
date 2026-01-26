import { useState, useEffect } from 'react';
import { Plus, Trash2, Phone, User } from 'lucide-react';
import { teamsApi } from '../lib/supabase';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await teamsApi.getAll();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const newTeam = await teamsApi.create({
        name: formData.name,
        phone: formData.phone,
      });
      setTeams([newTeam, ...teams]);
      setFormData({ name: '', phone: '' });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to add team member. Make sure the teams table exists in Supabase.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await teamsApi.delete(id);
      setTeams(teams.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team member');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Teams</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Add Team Member
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 12, padding: 40 }}>
          <h4>No team members yet</h4>
          <p>Add team members to dispatch to report locations.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
            style={{ marginTop: 16 }}
          >
            <Plus size={16} />
            Add First Member
          </button>
        </div>
      ) : (
        <div className="teams-grid">
          {teams.map((team) => (
            <div key={team.id} className="team-card">
              <div className="team-card-header">
                <div>
                  <h4>
                    <User size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    {team.name}
                  </h4>
                  <div className="phone">
                    <Phone size={14} />
                    <a href={`tel:${team.phone}`}>{team.phone}</a>
                  </div>
                </div>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(team.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Team Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Team Member</h3>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+970 5XX XXX XXX"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
