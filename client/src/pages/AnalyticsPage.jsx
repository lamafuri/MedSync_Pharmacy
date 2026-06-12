import { useState, useEffect } from 'react';
import { Crown, TrendingUp, Package, BarChart3, PieChart } from 'lucide-react';
import axios from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import PremiumGate from '../components/PremiumGate';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

function AnalyticsPage() {
  const { pharmacist } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pharmacist?.isPremium) {
      fetchAnalytics();
    }
  }, [pharmacist]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/offers/analytics');
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!pharmacist?.isPremium) {
    return (
      <div className="bg-card rounded-card border border-border p-12 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-20 h-20 bg-amber-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-amber" />
          </div>
          <h3 className="text-2xl font-bold text-primary mb-2">Analytics - Premium Feature</h3>
          <p className="text-muted mb-6">Unlock detailed insights about your offers, patient engagement, and pharmacy performance.</p>
          <button
            onClick={() => window.location.href = '/profile'}
            className="px-6 py-3 bg-amber text-white rounded-btn font-semibold hover:bg-amber/90 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-card border border-border p-6 animate-pulse">
            <div className="w-12 h-12 bg-faint rounded-xl mb-4" />
            <div className="h-8 bg-faint rounded mb-2" />
            <div className="h-4 bg-faint rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const COLORS = ['#00A878', '#0D1B2A', '#F59E0B', '#EF4444', '#009B6D'];

  const offerTypeData = Object.entries(analytics?.offersByType || {}).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  return (
    <PremiumGate feature="Analytics">
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={TrendingUp}
            label="Offers This Week"
            value={analytics?.offersThisWeek || 0}
            color="mint"
          />
          <KPICard
            icon={BarChart3}
            label="Offers This Month"
            value={analytics?.offersThisMonth || 0}
            color="navy"
          />
          <KPICard
            icon={Package}
            label="Acceptance Rate"
            value={`${analytics?.acceptanceRate || 0}%`}
            color="green"
          />
          <KPICard
            icon={PieChart}
            label="Total Offers"
            value={analytics?.offersThisMonth || 0}
            color="amber"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart - Offers Sent */}
          <div className="bg-card rounded-card border border-border p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Offers Sent (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.patientEngagement || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1B2A',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#00A878" strokeWidth={2} dot={{ fill: '#00A878' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Top Medicines */}
          <div className="bg-card rounded-card border border-border p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Top Medicines Needing Refill</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.topMedicines || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1B2A',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="url(#gradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0D1B2A" />
                    <stop offset="100%" stopColor="#00A878" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Offer Type Distribution */}
          <div className="bg-card rounded-card border border-border p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Offer Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={offerTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {offerTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#b0cfcc',
                    border: 'none',
                    borderRadius: '10px',
                  }}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Patient Engagement */}
          <div className="bg-card rounded-card border border-border p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Patient Engagement</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.patientEngagement || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1B2A',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#00A878" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PremiumGate>
  );
}

function KPICard({ icon: Icon, label, value, color }) {
  const colors = {
    mint: 'bg-mint-light text-mint',
    navy: 'bg-navy/10 text-navy',
    green: 'bg-green-light text-green',
    amber: 'bg-amber-light text-amber',
  };

  return (
    <div className="bg-card rounded-card border border-border p-6">
      <div className={`w-12 h-12 ${colors[color]} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-muted text-sm">{label}</p>
    </div>
  );
}

export default AnalyticsPage;
