import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { workflowApi } from '@/services/api';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  logEntry: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  debugLog: {
    color: '#858585',
  },
  infoLog: {
    color: '#4EC9B0',
  },
  warnLog: {
    color: '#CE9178',
  },
  errorLog: {
    color: '#F48771',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
});

interface LogEntry {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  timestamp: string;
  step_name?: string;
}

export default function LogViewerScreen({ route }: any) {
  const { executionId } = route.params;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, [executionId]);

  const loadLogs = async () => {
    try {
      const response = await workflowApi.getLogs(executionId);
      setLogs(response.data);

      if (flatListRef.current && response.data.length > 0) {
        setTimeout(
          () =>
            flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getLogStyle = (level: string) => {
    switch (level) {
      case 'DEBUG':
        return styles.debugLog;
      case 'INFO':
        return styles.infoLog;
      case 'WARN':
        return styles.warnLog;
      case 'ERROR':
        return styles.errorLog;
      default:
        return styles.infoLog;
    }
  };

  const renderLog = ({ item }: { item: LogEntry }) => (
    <View style={styles.logEntry}>
      <Text style={[styles.logText, getLogStyle(item.level)]}>
        [{item.level}] {new Date(item.timestamp).toLocaleTimeString()} -
        {item.step_name && ` (${item.step_name})`} {item.message}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#4EC9B0" />
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={logs}
      renderItem={renderLog}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={logs.length === 0 ? styles.centerContainer : {}}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No logs available</Text>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadLogs} />
      }
    />
  );
}
