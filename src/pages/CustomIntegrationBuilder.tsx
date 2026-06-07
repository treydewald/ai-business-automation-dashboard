import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Picker,
} from 'react-native';

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
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSecondary: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonTextSecondary: {
    color: '#333',
  },
  testResult: {
    backgroundColor: '#f0f0f0',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    padding: 10,
    marginTop: 10,
    borderRadius: 4,
  },
  testResultSuccess: {
    borderLeftColor: '#34C759',
  },
  testResultError: {
    borderLeftColor: '#FF3B30',
  },
  testResultText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
});

interface RequestTemplate {
  method: string;
  url: string;
  headers: { [key: string]: string };
  body?: string;
  auth?: {
    type: string;
    credentials: { [key: string]: string };
  };
}

interface ResponseMapping {
  extract_json_path?: string;
  extract_regex?: string;
  extract_header?: string;
  default_value?: string;
}

export default function CustomIntegrationBuilder() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [authType, setAuthType] = useState('none');
  const [authValue, setAuthValue] = useState('');
  const [extractJsonPath, setExtractJsonPath] = useState('');
  const [testContext, setTestContext] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    if (!url) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    setTesting(true);
    try {
      const context = JSON.parse(testContext);
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          method,
          url,
          auth_type: authType,
          auth_value: authValue,
          context,
          extract_json_path: extractJsonPath,
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        status: 'error',
        message: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!name || !url) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name,
          description,
          method,
          url,
          auth_type: authType,
          auth_value: authValue,
          extract_json_path: extractJsonPath || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save integration');
      }

      const result = await response.json();
      Alert.alert(
        'Success',
        `Integration "${name}" created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setName('');
              setDescription('');
              setUrl('');
              setAuthType('none');
              setAuthValue('');
              setExtractJsonPath('');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integration Details</Text>

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., My Custom API"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe what this integration does"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Request Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HTTP Request</Text>

          <Text style={styles.label}>Method</Text>
          <Picker
            selectedValue={method}
            onValueChange={setMethod}
            style={styles.picker}
          >
            <Picker.Item label="GET" value="GET" />
            <Picker.Item label="POST" value="POST" />
            <Picker.Item label="PUT" value="PUT" />
            <Picker.Item label="DELETE" value="DELETE" />
            <Picker.Item label="PATCH" value="PATCH" />
          </Picker>

          <Text style={styles.label}>URL *</Text>
          <TextInput
            style={styles.input}
            placeholder="https://api.example.com/endpoint"
            value={url}
            onChangeText={setUrl}
          />

          <Text style={styles.label}>Authentication Type</Text>
          <Picker
            selectedValue={authType}
            onValueChange={setAuthType}
            style={styles.picker}
          >
            <Picker.Item label="None" value="none" />
            <Picker.Item label="Bearer Token" value="bearer" />
            <Picker.Item label="API Key" value="api_key" />
            <Picker.Item label="Basic Auth" value="basic" />
          </Picker>

          {authType !== 'none' && (
            <>
              <Text style={styles.label}>Auth Credentials</Text>
              <TextInput
                style={styles.input}
                placeholder={
                  authType === 'bearer'
                    ? 'Enter token'
                    : authType === 'api_key'
                    ? 'Enter API key'
                    : 'user:password'
                }
                value={authValue}
                onChangeText={setAuthValue}
                secureTextEntry
              />
            </>
          )}
        </View>

        {/* Response Mapping */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Response Mapping</Text>

          <Text style={styles.label}>JSON Path (to extract data)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., data.users[0].name"
            value={extractJsonPath}
            onChangeText={setExtractJsonPath}
          />

          <Text style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
            Leave empty to return entire response
          </Text>
        </View>

        {/* Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Integration</Text>

          <Text style={styles.label}>Test Context (JSON)</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder={'{\n  "key": "value"\n}'}
            value={testContext}
            onChangeText={setTestContext}
            multiline
            editable={!testing}
          />

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleTest}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color="#333" />
            ) : (
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Test Integration
              </Text>
            )}
          </TouchableOpacity>

          {testResult && (
            <View
              style={[
                styles.testResult,
                testResult.status === 'success'
                  ? styles.testResultSuccess
                  : styles.testResultError,
              ]}
            >
              <Text style={styles.testResultText}>
                Status: {testResult.status}
              </Text>
              {testResult.status_code && (
                <Text style={styles.testResultText}>
                  HTTP: {testResult.status_code}
                </Text>
              )}
              {testResult.result && (
                <Text style={styles.testResultText}>
                  Result: {JSON.stringify(testResult.result, null, 2)}
                </Text>
              )}
              {testResult.message && (
                <Text style={styles.testResultText}>
                  Error: {testResult.message}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Save */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Integration</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
