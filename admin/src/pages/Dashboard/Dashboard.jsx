import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api';
import { Card, StatCard } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { HiShoppingBag, HiCurrencyDollar, HiUsers, HiCubeTransparent, HiClock, HiCreditCard } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import './Dashboard.css';

const STATUS_COLORS = {
  placed: '#3b82f6',
  confirmed: '#f59e0b',
  preparing: '#ec4899',
  ready: '#10b981',
  out_for_delivery: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await analyticsAPI.getDashboard();
      setData(data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading text="Loading dashboard..." />;
  if (!data) return <div className="empty-state">No data available</div>;

  const pieData = Object.entries(data.order_status_distribution)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: status, value: count }));

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Orders" value={data.stats.total_orders} icon={HiShoppingBag} color="#3b82f6" />
        <StatCard title="Total Revenue" value={`$${data.stats.total_revenue.toFixed(2)}`} icon={HiCurrencyDollar} color="#22c55e" />
        <StatCard title="Total Users" value={data.stats.total_users} icon={HiUsers} color="#8b5cf6" />
        <StatCard title="Food Items" value={data.stats.total_food_items} icon={HiCubeTransparent} color="#f97316" />
        <StatCard title="Active Orders" value={data.stats.active_orders} icon={HiClock} color="#f59e0b" />
        <StatCard title="Today's Revenue" value={`$${data.stats.today_revenue.toFixed(2)}`} icon={HiCreditCard} color="#06b6d4" subtitle={`${data.stats.today_orders} orders today`} />
      </div>

      <div className="dashboard-charts">
        <Card className="chart-card">
          <h3 className="card-title">Sales (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.sales_chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="charts-right">
          <Card className="chart-card">
            <h3 className="card-title">Order Status</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '24px' }}>No orders yet</div>
            )}
          </Card>

          <Card className="chart-card">
            <h3 className="card-title">Top Selling Items</h3>
            <div className="top-foods-list">
              {data.top_foods.map((food, idx) => (
                <div key={food.food_id} className="top-food-item">
                  <span className="top-food-rank">#{idx + 1}</span>
                  <div className="top-food-info">
                    <span className="top-food-name">{food.food_name}</span>
                    <span className="top-food-qty">{food.total_quantity} sold</span>
                  </div>
                  <span className="top-food-revenue">${food.total_revenue.toFixed(2)}</span>
                </div>
              ))}
              {data.top_foods.length === 0 && <div className="empty-state" style={{ padding: '16px' }}>No sales data</div>}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Recent Orders</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.user_name}</td>
                  <td>${order.final_amount.toFixed(2)}</td>
                  <td><span className={`badge-status badge-${order.status}`}>{order.status}</span></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
