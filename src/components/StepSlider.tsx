import { useCallback, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { colors, fonts, overline } from "@/theme";

const THUMB_SIZE = 22;
const TRACK_HEIGHT = 6;

interface Props {
  label: string;
  steps: readonly string[];
  /** Index into `steps`. */
  value: number;
  onChange: (index: number) => void;
}

/**
 * A discrete, labeled slider snapping to one of `steps`.
 *
 * Built on PanResponder rather than a native slider library so this stays a
 * plain-JS component — no new native module, no dev-client rebuild.
 */
export function StepSlider({ label, steps, value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const widthRef = useRef(0);
  const valueRef = useRef(value);
  valueRef.current = value;

  // locationX is relative to the touched view itself, so it stays correct
  // even when an ancestor ScrollView has scrolled — unlike pageX, which is an
  // absolute screen coordinate that would need re-measuring on every scroll.
  const indexFromLocationX = useCallback(
    (locationX: number) => {
      const width = widthRef.current;
      if (width <= 0) return valueRef.current;
      const ratio = Math.min(1, Math.max(0, locationX / width));
      return Math.round(ratio * (steps.length - 1));
    },
    [steps.length]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => onChange(indexFromLocationX(event.nativeEvent.locationX)),
      onPanResponderMove: (event) => onChange(indexFromLocationX(event.nativeEvent.locationX))
    })
  ).current;

  function handleLayout(event: LayoutChangeEvent) {
    const width = event.nativeEvent.layout.width;
    widthRef.current = width;
    setTrackWidth(width);
  }

  const ratio = steps.length > 1 ? value / (steps.length - 1) : 0;
  const fillWidth = ratio * trackWidth;

  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valuePill}>
          <Text style={styles.valueText}>{steps[value]}</Text>
        </View>
      </View>

      <View
        style={styles.track}
        onLayout={handleLayout}
        hitSlop={{ top: 14, bottom: 14 }}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackBg} />
        <View style={[styles.trackFill, { width: fillWidth }]} />
        {trackWidth > 0
          ? steps.map((_, index) => {
              const left =
                (steps.length > 1 ? index / (steps.length - 1) : 0) * trackWidth;
              return (
                <View
                  key={index}
                  pointerEvents="none"
                  style={[
                    styles.tick,
                    {
                      left: left - 2,
                      backgroundColor: index <= value ? "#fff" : colors.border
                    }
                  ]}
                />
              );
            })
          : null}
        <View pointerEvents="none" style={[styles.thumb, { left: fillWidth - THUMB_SIZE / 2 }]} />
      </View>

      <View style={styles.endsRow}>
        <Text style={styles.endLabel}>{steps[0]}</Text>
        <Text style={styles.endLabel}>{steps[steps.length - 1]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  label: {
    fontFamily: fonts.semi,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.ink,
    flexShrink: 1
  },
  valuePill: {
    backgroundColor: colors.uwRedTint,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10
  },
  valueText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.uwRedDeep
  },
  track: {
    height: THUMB_SIZE,
    justifyContent: "center"
  },
  trackBg: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.border
  },
  trackFill: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.uwRed
  },
  tick: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    top: THUMB_SIZE / 2 - 2
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: colors.uwRed,
    shadowColor: colors.ink,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  endsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8
  },
  endLabel: {
    ...overline,
    fontSize: 9,
    lineHeight: 12
  }
});
