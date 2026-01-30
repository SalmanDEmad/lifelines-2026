import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertTriangle, MapPin, Users, Clock,
  Download, Filter, RefreshCw, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { reportsApi } from '../lib/supabase';
import { getTwemojiUrl } from '../lib/emoji';

// Region configurations with colors
const REGIONS = {
  palestine: { name: 'Palestine', flag: '🇵🇸', color: '#22c55e' },
  sudan: { name: 'Sudan', flag: '🇸🇩', color: '#ef4444' },
  yemen: { name: 'Yemen', flag: '🇾🇪', color: '#f59e0b' },
  syria: { name: 'Syria', flag: '🇸🇾', color: '#3b82f6' },
  ukraine: { name: 'Ukraine', flag: '🇺🇦', color: '#0ea5e9' },
  afghanistan: { name: 'Afghanistan', flag: '🇦🇫', color: '#8b5cf6' },
  lebanon: { name: 'Lebanon', flag: '🇱🇧', color: '#ec4899' },
  somalia: { name: 'Somalia', flag: '🇸🇴', color: '#14b8a6' },
};

const CATEGORY_COLORS = {
  rubble: '#EF4444',
  hazard: '#F59E0B',
  blocked_road: '#3B82F6',
};

const STATUS_COLORS = {
  pending: '#9CA3AF',
  in_progress: '#F59E0B',
  resolved: '#22C55E',
};

export default function Analytics() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, all
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedRegion]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getAll();
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter reports by date range
  const filteredReports = reports.filter(report => {
    if (dateRange === 'all') return true;
    
    const reportDate = new Date(report.created_at || report.timestamp);
    const now = new Date();
    const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return reportDate >= cutoff;
  });

  // Calculate statistics
  const stats = {
    total: filteredReports.length,
    pending: filteredReports.filter(r => r.status === 'pending' || !r.status).length,
    inProgress: filteredReports.filter(r => r.status === 'in_progress').length,
    resolved: filteredReports.filter(r => r.status === 'resolved').length,
  };

  // Reports by category
  const categoryData = [
    { name: 'Rubble', value: filteredReports.filter(r => r.category === 'rubble').length, color: CATEGORY_COLORS.rubble },
    { name: 'Hazard', value: filteredReports.filter(r => r.category === 'hazard').length, color: CATEGORY_COLORS.hazard },
    { name: 'Blocked Road', value: filteredReports.filter(r => r.category === 'blocked_road').length, color: CATEGORY_COLORS.blocked_road },
  ];

  // Reports by status
  const statusData = [
    { name: 'Pending', value: stats.pending, color: STATUS_COLORS.pending },
    { name: 'In Progress', value: stats.inProgress, color: STATUS_COLORS.in_progress },
    { name: 'Resolved', value: stats.resolved, color: STATUS_COLORS.resolved },
  ];

  // Reports by region (estimate based on zone names)
  const regionData = Object.entries(REGIONS).map(([key, region]) => {
    const count = filteredReports.filter(r => {
      const zone = (r.zone || '').toLowerCase();
      // Simple heuristic - match zone name to region
      if (key === 'palestine') return zone.includes('gaza') || zone.includes('west bank');
      if (key === 'sudan') return zone.includes('khartoum') || zone.includes('darfur');
      if (key === 'ukraine') return zone.includes('kyiv') || zone.includes('kharkiv');
      if (key === 'syria') return zone.includes('aleppo') || zone.includes('damascus');
      if (key === 'yemen') return zone.includes('sanaa') || zone.includes('aden');
      if (key === 'afghanistan') return zone.includes('kabul') || zone.includes('kandahar');
      if (key === 'lebanon') return zone.includes('beirut');
      if (key === 'somalia') return zone.includes('mogadishu');
      return false;
    }).length;
    
    return {
      name: region.name,
      flag: region.flag,
      reports: count,
      color: region.color,
    };
  }).filter(r => r.reports > 0);

  // Time series data (last 7 days)
  const getTimeSeriesData = () => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayReports = filteredReports.filter(r => {
        const reportDate = new Date(r.created_at || r.timestamp).toISOString().split('T')[0];
        return reportDate === dateStr;
      });
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rubble: dayReports.filter(r => r.category === 'rubble').length,
        hazard: dayReports.filter(r => r.category === 'hazard').length,
        blocked_road: dayReports.filter(r => r.category === 'blocked_road').length,
        total: dayReports.length,
      });
    }
    
    return data;
  };

  const timeSeriesData = getTimeSeriesData();

  // Resolution rate
  const resolutionRate = stats.total > 0 
    ? Math.round((stats.resolved / stats.total) * 100) 
    : 0;

  // Average resolution time (mock data since we don't have actual timestamps)
  const avgResolutionHours = 24 + Math.floor(Math.random() * 48);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin" size={32} color="#6b7280" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>📊 Analytics Dashboard</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
            }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <button 
            className="btn btn-secondary"
            onClick={fetchData}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Reports</div>
          <div className="stat-value">{stats.total}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            <TrendingUp size={14} style={{ display: 'inline', marginRight: '4px' }} />
            {dateRange === '7d' ? 'This week' : dateRange === '30d' ? 'This month' : 'All time'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolution Rate</div>
          <div className="stat-value" style={{ color: resolutionRate > 50 ? '#22c55e' : '#f59e0b' }}>
            {resolutionRate}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {stats.resolved} of {stats.total} resolved
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: '#9ca3af' }}>{stats.pending}</div>
          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
            Needs attention
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.inProgress}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Being addressed
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Time Series Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} />
            Reports Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="rubble" stackId="1" stroke={CATEGORY_COLORS.rubble} fill={CATEGORY_COLORS.rubble} name="Rubble" />
              <Area type="monotone" dataKey="hazard" stackId="1" stroke={CATEGORY_COLORS.hazard} fill={CATEGORY_COLORS.hazard} name="Hazard" />
              <Area type="monotone" dataKey="blocked_road" stackId="1" stroke={CATEGORY_COLORS.blocked_road} fill={CATEGORY_COLORS.blocked_road} name="Blocked Road" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChartIcon size={20} />
            By Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Status Distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reports by Region */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Reports by Region</h3>
          {regionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reports" fill="#3b82f6">
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '250px',
              color: '#6b7280' 
            }}>
              No region data available
            </div>
          )}
        </div>
      </div>

      {/* Hazard Breakdown */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} color="#f59e0b" />
          Hazard Subcategories
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { name: 'UXO/Explosives', icon: '💣', count: filteredReports.filter(r => r.subcategory === 'unexploded_ordnance').length },
            { name: 'Structural Risk', icon: '🏚️', count: filteredReports.filter(r => r.subcategory === 'structural_risk').length },
            { name: 'Electrical', icon: '⚡', count: filteredReports.filter(r => r.subcategory === 'electrical').length },
            { name: 'Chemical/Gas', icon: '☢️', count: filteredReports.filter(r => r.subcategory === 'chemical_gas').length },
            { name: 'Contaminated Water', icon: '💧', count: filteredReports.filter(r => r.subcategory === 'contaminated_water').length },
            { name: 'Medical Emergency', icon: '🚑', count: filteredReports.filter(r => r.subcategory === 'medical_emergency').length },
          ].map(hazard => (
            <div 
              key={hazard.name}
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <img 
                src={getTwemojiUrl(hazard.icon)} 
                alt={hazard.icon} 
                style={{ width: '32px', height: '32px' }} 
              />
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{hazard.name}</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{hazard.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
