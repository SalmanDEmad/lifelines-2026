import { useState, useEffect } from 'react';
import { Plus, Trash2, Phone, User, ChevronDown, ChevronUp } from 'lucide-react';
import { teamsApi } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';

export default function Teams() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [teamFormData, setTeamFormData] = useState({ name: '', phone: '', description: '' });
  const [memberFormData, setMemberFormData] = useState({ name: '', phone: '', team_id: null });

  const fetchTeamsAndMembers = async () => {
    setLoading(true);
    try {
      const teamsData = await teamsApi.getAll();
      const membersData = await teamsApi.getAllMembers();
      console.log('Teams loaded:', teamsData);
      console.log('Members loaded:', membersData);
      setTeams(teamsData);
      setMembers(membersData);
      
      // Expand all teams by default
      const expanded = {};
      teamsData.forEach(team => {
        expanded[team.id] = true;
      });
      setExpandedTeams(expanded);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsAndMembers();
  }, []);

  const toggleTeam = (teamId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!teamFormData.name.trim()) {
      alert(t('teams.enterTeamName'));
      return;
    }

    try {
      const newTeam = await teamsApi.createTeam({
        name: teamFormData.name,
        phone: teamFormData.phone || '+1 (000) 000-0000',
        description: teamFormData.description || '',
      });
      setTeams([newTeam, ...teams]);
      setExpandedTeams(prev => ({ ...prev, [newTeam.id]: true }));
      setTeamFormData({ name: '', phone: '', description: '' });
      setShowTeamModal(false);
    } catch (error) {
      console.error('Error creating team:', error);
      alert(t('teams.errorCreatingTeam'));
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    
    if (!memberFormData.name || !memberFormData.phone) {
      alert(t('teams.fillAllFields'));
      return;
    }

    try {
      const newMember = await teamsApi.createMember({
        name: memberFormData.name,
        phone: memberFormData.phone,
        team_id: memberFormData.team_id || null,
      });
      setMembers([newMember, ...members]);
      setMemberFormData({ name: '', phone: '', team_id: null });
      setShowMemberModal(false);
    } catch (error) {
      console.error('Error creating member:', error);
      alert(t('teams.errorAddingMember'));
    }
  };

  const handleDeleteMember = async (id) => {
    if (!confirm(t('teams.deleteMemberConfirm'))) return;
    
    try {
      console.log('[INFO] Attempting to delete member:', id);
      await teamsApi.deleteMember(id);
      console.log('[SUCCESS] Member deleted, updating UI');
      setMembers(members.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting member:', error);
      alert(t('teams.errorDeletingMember'));
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm(t('teams.deleteTeamConfirm'))) return;
    
    try {
      console.log('[INFO] Attempting to delete team:', id);
      await teamsApi.deleteTeam(id);
      console.log('[SUCCESS] Team deleted, updating UI');
      setTeams(teams.filter(t => t.id !== id));
      setMembers(members.map(m => m.team_id === id ? { ...m, team_id: null } : m));
    } catch (error) {
      console.error('Error deleting team:', error);
      alert(t('teams.errorDeletingTeam'));
    }
  };

  const getTeamMembers = (teamId) => {
    return members.filter(m => m.team_id === teamId);
  };

  const getUnassignedMembers = () => {
    return members.filter(m => !m.team_id);
  };

  return (
    <div>
      <div className="page-header">
        <h2>{t('teams.title')}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setShowTeamModal(true)}>
            <Plus size={16} />
            {t('teams.createTeam')}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
            <Plus size={16} />
            {t('teams.addMember')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">{t('common.loading')}</div>
      ) : teams.length === 0 && members.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 12, padding: 40 }}>
          <h4>{t('teams.noTeamsYet')}</h4>
          <p>Create a team and add members to organize your workforce.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowTeamModal(true)}
            >
              <Plus size={16} />
              {t('teams.createTeam')}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowMemberModal(true)}
            >
              <Plus size={16} />
              {t('teams.addMember')}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 20 }}>
          {/* Teams with members */}
          {teams.map((team) => {
            const teamMembers = getTeamMembers(team.id);
            const isExpanded = expandedTeams[team.id];
            
            return (
              <div key={team.id} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#f3f4f6' : 'white',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                  onClick={() => toggleTeam(team.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600 }}>
                        {team.name}
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                        {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Team members list */}
                {isExpanded && teamMembers.length > 0 && (
                  <div style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '8px 16px' }}>
                    {teamMembers.map((member) => (
                      <div 
                        key={member.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 0',
                          borderBottom: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, marginLeft: 32 }}>
                          <User size={16} style={{ color: '#6b7280' }} />
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>{member.name}</p>
                            <a 
                              href={`tel:${member.phone}`}
                              style={{ margin: 0, fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}
                            >
                              <Phone size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                              {member.phone}
                            </a>
                          </div>
                        </div>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && teamMembers.length === 0 && (
                  <div style={{ 
                    padding: '16px 32px', 
                    backgroundColor: '#f9fafb',
                    borderTop: '1px solid #e5e7eb',
                    color: '#6b7280',
                    fontSize: 13,
                    fontStyle: 'italic'
                  }}>
                    No members assigned to this team yet
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned members - as a card */}
          {members.some(m => !m.team_id) && (
            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  cursor: 'pointer',
                  backgroundColor: expandedTeams['unassigned'] ? '#f3f4f6' : 'white',
                  borderBottom: '1px solid #e5e7eb'
                }}
                onClick={() => setExpandedTeams(prev => ({ ...prev, unassigned: !prev.unassigned }))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {expandedTeams['unassigned'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>
                      Unassigned
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                      {getUnassignedMembers().length} member{getUnassignedMembers().length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {expandedTeams['unassigned'] && getUnassignedMembers().length > 0 && (
                <div style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '8px 16px' }}>
                  {getUnassignedMembers().map((member) => (
                    <div 
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, marginLeft: 32 }}>
                        <User size={16} style={{ color: '#6b7280' }} />
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>{member.name}</p>
                          <a 
                            href={`tel:${member.phone}`}
                            style={{ margin: 0, fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}
                          >
                            <Phone size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {member.phone}
                          </a>
                        </div>
                      </div>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      {showTeamModal && (
        <div className="modal-overlay" onClick={() => setShowTeamModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('teams.createTeam')}</h3>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setShowTeamModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('teams.teamName')}</label>
                  <input
                    type="text"
                    value={teamFormData.name}
                    onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                    placeholder={t('teams.teamNamePlaceholder')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('teams.phone')}</label>
                  <input
                    type="tel"
                    value={teamFormData.phone}
                    onChange={(e) => setTeamFormData({ ...teamFormData, phone: e.target.value })}
                    placeholder={t('teams.phonePlaceholder')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('teams.description')}</label>
                  <input
                    type="text"
                    value={teamFormData.description}
                    onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                    placeholder={t('teams.descriptionPlaceholder')}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTeamModal(false)}
                >
                  {t('teams.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  {t('teams.createTeam')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('teams.addMember')}</h3>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => setShowMemberModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('auth.name')}</label>
                  <input
                    type="text"
                    value={memberFormData.name}
                    onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                    placeholder={t('auth.namePlaceholder')}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('teams.phone')}</label>
                  <input
                    type="tel"
                    value={memberFormData.phone}
                    onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                    placeholder="+970 5XX XXX XXX"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Assign to Team</label>
                  {teams.length === 0 ? (
                    <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px', fontSize: '14px', color: '#666' }}>
                      {t('teams.noTeamsYet')}
                    </div>
                  ) : (
                    <select
                      value={memberFormData.team_id || ''}
                      onChange={(e) => setMemberFormData({ ...memberFormData, team_id: e.target.value || null })}
                    >
                      <option value="">Unassigned</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowMemberModal(false)}
                >
                  {t('teams.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  {t('teams.addMember')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
