import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";

import { MAP_STYLE, MAP_STYLE_PREVIEW } from "@/data/mapStyle";
import { MAP_PROVIDER } from "@/lib/mapProvider";
import { colors } from "@/theme";
import type { RouteOption } from "@/types/spot";

// Padding around the route's bounding box, as a fraction of its own span, so
// the line never runs to the edge of the frame.
const REGION_PADDING = 0.45;
// Floor on the span, for trips short enough that the box would otherwise be a
// point and Google would zoom to street level.
const MIN_DELTA = 0.004;

/** A region that frames the whole route. */
function regionFor(option: RouteOption): Region {
  const points = option.segments.flatMap((segment) => segment.points);
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(MIN_DELTA, (maxLat - minLat) * (1 + REGION_PADDING * 2)),
    longitudeDelta: Math.max(MIN_DELTA, (maxLng - minLng) * (1 + REGION_PADDING * 2))
  };
}

/**
 * A route drawn on the campus basemap.
 *
 * Walk stretches are dotted stone; the ride is solid in the mode's color — for
 * the bus, the agency's own route color along its own shape. `compact` drops
 * the vehicle marker and the map labels for the small previews on the route
 * cards, where street names would be unreadable anyway.
 */
export function RouteMap({
  option,
  progress = 0,
  compact = false
}: {
  option: RouteOption;
  /** Index of the leg currently under way; earlier legs recede. */
  progress?: number;
  compact?: boolean;
}) {
  const region = useMemo(() => regionFor(option), [option]);
  const rideIndex = option.segments.findIndex((segment) => segment.kind === "ride");

  const start = option.segments[0]?.points[0];
  const endSegment = option.segments[option.segments.length - 1];
  const end = endSegment?.points[endSegment.points.length - 1];

  // Park the vehicle midway along the ride leg, as the design shows it.
  const vehicle =
    !compact && rideIndex >= 0
      ? option.segments[rideIndex].points[
          Math.floor(option.segments[rideIndex].points.length / 2)
        ]
      : null;

  return (
    <View style={styles.wrap}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={MAP_PROVIDER}
        customMapStyle={compact ? MAP_STYLE_PREVIEW : MAP_STYLE}
        region={region}
        showsPointsOfInterests={false}
        showsBuildings={false}
        showsIndoors={false}
        showsCompass={false}
        toolbarEnabled={false}
        // A preview is an illustration inside a tappable card, so it must not
        // swallow the press or scroll with the list.
        scrollEnabled={!compact}
        zoomEnabled={!compact}
        rotateEnabled={false}
        pitchEnabled={false}
        pointerEvents={compact ? "none" : "auto"}
      >
        {option.segments.map((segment, index) => {
          const isRide = segment.kind === "ride";
          return (
            <Polyline
              key={index}
              coordinates={segment.points.map((p) => ({
                latitude: p.lat,
                longitude: p.lng
              }))}
              strokeColor={isRide ? option.color : colors.stone}
              strokeWidth={isRide ? (compact ? 4 : 6) : compact ? 3 : 4}
              // Dashes mark the stretches on foot.
              lineDashPattern={isRide ? undefined : [2, 6]}
              lineCap="round"
              lineJoin="round"
              // Completed legs sit under the ones still to come.
              zIndex={index < progress ? 1 : 2}
            />
          );
        })}

        {start ? (
          <Marker
            coordinate={{ latitude: start.lat, longitude: start.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={[styles.node, compact && styles.nodeSmall, styles.nodeStart]} />
          </Marker>
        ) : null}

        {end ? (
          <Marker
            coordinate={{ latitude: end.lat, longitude: end.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.node,
                compact ? styles.nodeSmall : styles.nodeLarge,
                styles.nodeEnd
              ]}
            />
          </Marker>
        ) : null}

        {vehicle ? (
          <Marker
            coordinate={{ latitude: vehicle.lat, longitude: vehicle.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={[styles.vehicle, { backgroundColor: option.color }]}>
              <Ionicons name={option.icon as never} size={11} color="#fff" />
            </View>
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.mapLand
  },
  node: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  nodeSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2
  },
  nodeLarge: {
    width: 20,
    height: 20,
    borderRadius: 10
  },
  nodeStart: {
    backgroundColor: colors.ink
  },
  nodeEnd: {
    backgroundColor: colors.uwRed
  },
  vehicle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6
  }
});
