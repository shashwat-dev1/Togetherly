/**
 * TOGETHERLY — ONBOARDING NAVIGATION STACK
 */
import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="pair" />
    </Stack>
  );
}

