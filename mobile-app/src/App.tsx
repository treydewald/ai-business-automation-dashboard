import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { useAuthStore } from '@/store/auth';
import { initializePushNotifications } from '@/services/notifications';

import LoginScreen from '@/screens/auth/LoginScreen';
import WorkflowListScreen from '@/screens/workflows/WorkflowListScreen';
import WorkflowDetailScreen from '@/screens/workflows/WorkflowDetailScreen';
import ExecutionDetailScreen from '@/screens/executions/ExecutionDetailScreen';
import LogViewerScreen from '@/screens/executions/LogViewerScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            {!isAuthenticated ? (
              <Stack.Group
                screenOptions={{
                  headerShown: false,
                  animationEnabled: false,
                }}
              >
                <Stack.Screen name="Login" component={LoginScreen} />
              </Stack.Group>
            ) : (
              <Stack.Group
                screenOptions={{
                  headerShown: true,
                }}
              >
                <Stack.Screen
                  name="WorkflowList"
                  component={WorkflowListScreen}
                  options={{ title: 'Workflows' }}
                />
                <Stack.Screen
                  name="WorkflowDetail"
                  component={WorkflowDetailScreen}
                  options={({ route }: any) => ({
                    title: route.params?.name || 'Workflow',
                  })}
                />
                <Stack.Screen
                  name="ExecutionDetail"
                  component={ExecutionDetailScreen}
                  options={{ title: 'Execution' }}
                />
                <Stack.Screen
                  name="LogViewer"
                  component={LogViewerScreen}
                  options={{ title: 'Logs' }}
                />
              </Stack.Group>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
