import React from "react";
import { View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  PaperProvider,
  MD3LightTheme,
  Snackbar,
  ActivityIndicator,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp } from "./src/context/AppContext";
import { colors } from "./src/components/UI";
import ConversationScreen from "./src/screens/ConversationScreen";
import SignalsScreen, { SignalDetailScreen } from "./src/screens/SignalsScreen";
import CaptureScreen from "./src/screens/CaptureScreen";
import AuthScreen from "./src/screens/AuthScreen";
import PhrasesScreen, { PhraseEditScreen } from "./src/screens/PhrasesScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import HelpScreen, { LearnScreen } from "./src/screens/HelpScreen";
const Stack = createNativeStackNavigator(),
  Tabs = createBottomTabNavigator();
const theme = {
  ...MD3LightTheme,
  roundness: 5,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.purple,
    secondaryContainer: "#EEE7F6",
    onSecondaryContainer: colors.purple,
    background: colors.background,
    surface: "#FFFFFF",
    onSurface: colors.ink,
  },
};
function MainTabs() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.purple,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: "#fff", borderTopColor: colors.line },
          tabBarLabelStyle: { fontSize: 11 },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name={
                {
                  Conversation: "hand-wave-outline",
                  Signals: "cards-outline",
                  Phrases: "bookmark-outline",
                  Settings: "tune-variant",
                }[route.name]
              }
              color={color}
              size={size}
            />
          ),
        })}
      >
        <Tabs.Screen
          name="Conversation"
          component={ConversationScreen}
          options={{ title: "Conversar" }}
        />
        <Tabs.Screen
          name="Signals"
          component={SignalsScreen}
          options={{ title: "Meus sinais" }}
        />
        <Tabs.Screen
          name="Phrases"
          component={PhrasesScreen}
          options={{ title: "Frases" }}
        />
        <Tabs.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Ajustes" }}
        />
      </Tabs.Navigator>
    </SafeAreaView>
  );
}
function Root() {
  const app = useApp();
  if (!app.ready)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <ActivityIndicator />
        <Text>Preparando seu espaço…</Text>
      </View>
    );
  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer
        theme={{
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: colors.background,
            primary: colors.purple,
          },
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerTintColor: colors.purple,
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerBackTitle: "Voltar",
          }}
        >
          <Stack.Screen
            name="Home"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Capture"
            component={CaptureScreen}
            options={{ title: "Cadastrar" }}
          />
          <Stack.Screen
            name="SignalDetail"
            component={SignalDetailScreen}
            options={{ title: "Detalhes do sinal" }}
          />
          <Stack.Screen
            name="Login"
            component={AuthScreen}
            options={{ title: "Sua conta" }}
          />
          <Stack.Screen
            name="PhraseEdit"
            component={PhraseEditScreen}
            options={{ title: "Frases" }}
          />
          <Stack.Screen
            name="Help"
            component={HelpScreen}
            options={{ title: "Como usar" }}
          />
          <Stack.Screen
            name="Learn"
            component={LearnScreen}
            options={{ title: "Conhecer" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Snackbar
        visible={!!app.notice}
        onDismiss={() => app.setNotice("")}
        duration={4000}
        action={{ label: "Fechar", onPress: () => app.setNotice("") }}
      >
        {app.notice}
      </Snackbar>
    </>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AppProvider>
          <Root />
        </AppProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
