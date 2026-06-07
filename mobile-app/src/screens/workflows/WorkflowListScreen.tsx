import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuthStore } from '@/store/auth';
import { workflowApi } from '@/services/api';
import { cacheService } from '@/services/cache';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    paddingRight: 15,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

export default function WorkflowListScreen({ navigation }: any) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const cached = await cacheService.get<Workflow[]>('workflows');
      if (cached) {
        setWorkflows(cached);
      }

      const response = await workflowApi.listWorkflows(0, 50);
      const data = response.data;
      setWorkflows(data);
      await cacheService.set('workflows', data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      Alert.alert('Error', 'Failed to load workflows');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cacheService.remove('workflows');
    await loadWorkflows();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const renderWorkflow = ({ item }: { item: Workflow }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('WorkflowDetail', {
          id: item.id,
          name: item.name,
        })
      }
    >
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.status}>Status: {item.status}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate('ExecutionDetail', {
              workflowId: item.id,
            })
          }
        >
          <Text style={styles.buttonText}>Run</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <FlatList
      data={workflows}
      renderItem={renderWorkflow}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={workflows.length === 0 ? styles.centerContainer : {}}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No workflows found</Text>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}
