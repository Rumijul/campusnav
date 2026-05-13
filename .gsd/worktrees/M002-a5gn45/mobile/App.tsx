import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import {
  createInitialAppBootstrapState,
  runAppBootstrap,
  type AppBootstrapState,
} from "./bootstrap/appBootstrap";

function renderStatus(state: AppBootstrapState) {
  if (state.phase === "ready") {
    return {
      title: "CampusNav is ready",
      detail: `Connected to ${state.apiBaseUrl}`,
    };
  }

  if (state.phase === "error") {
    return {
      title: "CampusNav startup failed",
      detail: state.error
        ? `${state.error.reason}: ${state.error.message}`
        : "Unknown startup failure",
    };
  }

  if (state.phase === "loading") {
    return {
      title: "Starting CampusNav",
      detail: "Loading visitor map bootstrap resources...",
    };
  }

  return {
    title: "Preparing CampusNav",
    detail: "Bootstrapping mobile runtime...",
  };
}

export default function App() {
  const [bootstrapState, setBootstrapState] = useState<AppBootstrapState>(() =>
    createInitialAppBootstrapState(),
  );

  useEffect(() => {
    let isMounted = true;

    void runAppBootstrap({
      envApiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      onTransition: (nextState) => {
        if (!isMounted) {
          return;
        }

        setBootstrapState(nextState);
      },
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const status = renderStatus(bootstrapState);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.heading}>{status.title}</Text>
        <Text style={styles.detail}>{status.detail}</Text>
        <Text style={styles.phaseLabel}>phase={bootstrapState.phase}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f9fafb",
  },
  detail: {
    fontSize: 15,
    lineHeight: 22,
    color: "#d1d5db",
  },
  phaseLabel: {
    fontSize: 13,
    color: "#9ca3af",
    fontFamily: "monospace",
  },
});
