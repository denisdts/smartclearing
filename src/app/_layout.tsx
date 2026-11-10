import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { PushNotificationsProvider } from '@/notifications/PushNotificationsContext';
import { PhotoProvider } from '@/photos/PhotoContext';
import { ThemeProvider, useTheme } from '@/theme-provider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function SplashController() {
  const { isLoading } = useAuth();
  const { isReady } = useTheme();

  useEffect(() => {
    if (!isLoading && isReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isLoading, isReady]);

  return null;
}

function RootNavigator() {
  const { session } = useAuth();
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SplashController />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PhotoProvider>
          <PushNotificationsProvider>
            <RootNavigator />
          </PushNotificationsProvider>
        </PhotoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
