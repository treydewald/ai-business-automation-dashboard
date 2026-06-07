import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { workflowApi } from '@/services/api';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 15,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  statusSuccessText: {
    color: '#fff',
    fontWeight: '600',
    backgroundColor: '#34C759',
  },
  statusFailureText: {
    color: '#fff',
    fontWeight: '600',
    backgroundColor: '#FF3B30',
  },
  statusRunningText: {
    color: '#fff',
    fontWeight: '600',
    backgroundColor: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

interface Execution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  result?: any;
}

export default function ExecutionDetailScreen({ route, navigation }: any) {
  const { id, workflowId } = route.params;
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExecution();
    const interval = setInterval(
      () => {
        if (!id) return;
        loadExecution();
      },
      3000
    );
    return () => clearInterval(interval);
  }, [id]);

  const loadExecution = async () => {
    try {
      const response = await workflowApi.getExecution(id);
      setExecution(response.data);
    } catch (error) {
      console.error('Failed to load execution:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return styles.statusSuccessText;
      case 'failed':
      case 'error':
        return styles.statusFailureText;
      case 'running':
      case 'in_progress':
        return styles.statusRunningText;
      default:
        return styles.statusRunningText;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!execution) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text>Execution not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadExecution} />
      }
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Execution Details</Text>
          <Text style={[styles.statusBadge, getStatusStyle(execution.status)]}>
            {execution.status.toUpperCase()}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: '600' }}>Execution ID: </Text>
            {execution.id}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: '600' }}>Started: </Text>
            {new Date(execution.started_at).toLocaleString()}
          </Text>
          {execution.completed_at && (
            <Text style={styles.text}>
              <Text style={{ fontWeight: '600' }}>Completed: </Text>
              {new Date(execution.completed_at).toLocaleString()}
            </Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate('LogViewer', {
                executionId: id,
              })
            }
          >
            <Text style={styles.buttonText}>View Logs</Text>
          </TouchableOpacity>
        </View>

        {execution.result && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Result</Text>
            <Text style={styles.text}>
              {JSON.stringify(execution.result, null, 2)}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
