import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
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
  executionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  executionCardError: {
    borderLeftColor: '#FF3B30',
  },
});

interface Workflow {
  id: string;
  name: string;
  description: string;
  definition: any;
  status: string;
  created_at: string;
}

interface Execution {
  id: string;
  status: string;
  started_at: string;
  completed_at: string;
}

export default function WorkflowDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const [workflowRes, executionsRes] = await Promise.all([
        workflowApi.getWorkflow(id),
        workflowApi.getExecutions(id, 0, 10),
      ]);
      setWorkflow(workflowRes.data);
      setExecutions(executionsRes.data);
    } catch (error) {
      console.error('Failed to load workflow:', error);
      Alert.alert('Error', 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const response = await workflowApi.triggerWorkflow(id);
      Alert.alert('Success', 'Workflow execution started');
      navigation.navigate('ExecutionDetail', {
        id: response.data.execution_id,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to execute workflow');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!workflow) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text>Workflow not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workflow Information</Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: '600' }}>Name: </Text>
            {workflow.name}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: '600' }}>Status: </Text>
            {workflow.status}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: '600' }}>Created: </Text>
            {new Date(workflow.created_at).toLocaleDateString()}
          </Text>
          {workflow.description && (
            <Text style={styles.text}>
              <Text style={{ fontWeight: '600' }}>Description: </Text>
              {workflow.description}
            </Text>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleExecute}
            disabled={executing}
          >
            <Text style={styles.buttonText}>
              {executing ? 'Executing...' : 'Execute Workflow'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Executions</Text>
          {executions.length === 0 ? (
            <Text style={styles.text}>No executions yet</Text>
          ) : (
            executions.map((execution) => (
              <TouchableOpacity
                key={execution.id}
                onPress={() =>
                  navigation.navigate('ExecutionDetail', {
                    id: execution.id,
                  })
                }
              >
                <View
                  style={[
                    styles.executionCard,
                    execution.status === 'failed' &&
                      styles.executionCardError,
                  ]}
                >
                  <Text style={styles.text}>
                    Status: {execution.status}
                  </Text>
                  <Text style={styles.text}>
                    Started: {new Date(execution.started_at).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
