import { Component, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  children: ReactNode;
  /** Named in the fallback so it is obvious which map failed. */
  label: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches a crash inside a map so it does not black out the whole screen.
 *
 * `react-native-maps` fails at the native layer when its provider is
 * unavailable — a missing Google Maps SDK, a rejected API key — and without a
 * boundary that takes the entire tree down with it, which is
 * indistinguishable from the app never starting. Error boundaries have to be
 * class components; there is no hook equivalent.
 */
export class MapErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[map] ${this.props.label} crashed:`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.title}>Map failed to render</Text>
          <Text style={styles.detail}>{this.state.error.message}</Text>
          <Text style={styles.hint}>
            The rest of the screen still works. The native error is in the Metro
            logs.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#EDE7DA"
  },
  title: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    color: "#1D1A17",
    marginBottom: 8
  },
  detail: {
    fontSize: 12,
    lineHeight: 15,
    color: "#C5050C",
    textAlign: "center",
    marginBottom: 10
  },
  hint: {
    fontSize: 11,
    lineHeight: 16,
    color: "#5B564F",
    textAlign: "center"
  }
});
