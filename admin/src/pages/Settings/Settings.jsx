import { useState, useEffect } from 'react';
import { settingsAPI } from '../../api';
import { Card } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import toast from 'react-hot-toast';
import { HiCheckCircle } from 'react-icons/hi2';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await settingsAPI.getAll();
      setSettings(data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: { ...settings[key], value } });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, data] of Object.entries(settings)) {
        await settingsAPI.update(key, { value: data.value, description: data.description });
      }
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <HiCheckCircle size={18} /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      <Card>
        {Object.entries(settings).map(([key, data]) => (
          <div key={key} className="form-group">
            <label className="form-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
            {data.description && <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 6px' }}>{data.description}</p>}
            <input
              className="form-input"
              value={data.value}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        ))}
        {Object.keys(settings).length === 0 && (
          <div className="empty-state">No settings configured. Run the seed script to initialize.</div>
        )}
      </Card>
    </div>
  );
}
