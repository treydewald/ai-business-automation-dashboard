import { useState, useEffect, useCallback } from 'react';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Input } from '@components/Form/Input';
import { Select } from '@components/Form/Select';
import { Badge } from '@components/Badge';
import { Modal } from '@components/Modal';
import { Spinner } from '@components/Spinner';
import { EmptyState } from '@components/EmptyState';

interface Alert {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  is_enabled: boolean;
  status: string;
  notification_channels: string[];
  created_by_id: string;
  created_at: string;
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertCondition, setNewAlertCondition] = useState('failure_rate');
  const [newAlertThreshold, setNewAlertThreshold] = useState('50');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreateAlert = useCallback(async () => {
    if (!newAlertName.trim()) {
      alert('Alert name is required');
      return;
    }

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAlertName,
          condition: newAlertCondition,
          threshold: parseFloat(newAlertThreshold),
          notification_channels: ['email', 'slack'],
        }),
      });

      if (!response.ok) throw new Error('Failed to create alert');

      setShowCreateModal(false);
      setNewAlertName('');
      setNewAlertThreshold('50');
      fetchAlerts();
    } catch (err) {
      alert(`Error creating alert: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [newAlertName, newAlertCondition, newAlertThreshold, fetchAlerts]);

  const handleDeleteAlert = useCallback(async (alertId: string) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete alert');

      fetchAlerts();
    } catch (err) {
      alert(`Error deleting alert: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [fetchAlerts]);

  const handleSnoozeAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_minutes: 60 }),
      });

      if (!response.ok) throw new Error('Failed to snooze alert');

      fetchAlerts();
    } catch (err) {
      alert(`Error snoozing alert: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [fetchAlerts]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Alerts & Monitoring</h1>
        <p className="text-gray-600">Configure alerts for workflow failures and performance issues</p>
      </div>

      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowCreateModal(true)}>Create Alert</Button>
      </div>

      {error && (
        <Card className="mb-6 p-6 bg-red-50 border-red-200">
          <p className="text-red-800">Error: {error}</p>
        </Card>
      )}

      {alerts.length === 0 ? (
        <EmptyState
          title="No alerts configured"
          description="Create your first alert to get notified about workflow issues"
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{alert.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>

                  <div className="flex items-center gap-4 mt-4">
                    <Badge variant={alert.is_enabled ? 'success' : 'default'}>
                      {alert.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Condition: {alert.condition} &gt;= {alert.threshold}
                    </span>
                    <span className="text-sm text-gray-600">
                      Channels: {alert.notification_channels.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleSnoozeAlert(alert.id)}
                    variant="secondary"
                    className="text-sm"
                  >
                    Snooze
                  </Button>
                  <Button
                    onClick={() => handleDeleteAlert(alert.id)}
                    variant="danger"
                    className="text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Alert"
      >
        <div className="space-y-4">
          <Input
            placeholder="Alert name..."
            value={newAlertName}
            onChange={(e) => setNewAlertName(e.target.value)}
          />

          <Select
            value={newAlertCondition}
            onChange={(e) => setNewAlertCondition(e.target.value)}
          >
            <option value="failure_rate">Failure Rate %</option>
            <option value="execution_duration">Execution Duration (seconds)</option>
            <option value="error_type">Error Type</option>
            <option value="integration_error">Integration Error</option>
          </Select>

          <Input
            type="number"
            placeholder="Threshold value..."
            value={newAlertThreshold}
            onChange={(e) => setNewAlertThreshold(e.target.value)}
          />

          <div className="flex gap-4 justify-end">
            <Button
              onClick={() => setShowCreateModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAlert}>Create Alert</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
