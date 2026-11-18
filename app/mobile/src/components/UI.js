import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Button, Icon } from "react-native-paper";
export const colors = {
  purple: "#68508E",
  ink: "#292335",
  muted: "#70697B",
  background: "#F8F6FB",
  line: "#E6DFED",
  green: "#28755E",
};
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { fontSize: 26, fontWeight: "700", color: colors.ink },
  muted: { color: colors.muted, lineHeight: 21 },
  eyebrow: {
    color: colors.purple,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  grow: { flex: 1 },
  error: { color: "#A52A3A" },
  pill: {
    backgroundColor: "#EEE7F6",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
export function Page({ children, style }) {
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
export function Heading({ title, subtitle }) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.muted}>{subtitle}</Text>}
    </View>
  );
}
export function Empty({
  icon = "hand-wave-outline",
  title,
  description,
  action,
  onPress,
}) {
  return (
    <View style={[s.card, { alignItems: "center", paddingVertical: 32 }]}>
      <Icon source={icon} size={42} color={colors.purple} />
      <Text variant="titleMedium">{title}</Text>
      <Text style={[s.muted, { textAlign: "center" }]}>{description}</Text>
      {action && (
        <Button mode="contained" onPress={onPress}>
          {action}
        </Button>
      )}
    </View>
  );
}
