import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { CAT } from "@/data/categories";
import { MAP_STYLE } from "@/data/mapStyle";
import { MAP_PROVIDER } from "@/lib/mapProvider";
import { useMapTilt } from "@/lib/useMapTilt";
import { useMarkerTracking } from "@/lib/useMarkerTracking";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";
import type { Spot, StatusMeta } from "@/types/spot";

// Frames the isthmus campus — Union South through the Memorial Union Terrace.
// Tight enough that local streets are already drawn at first paint.
const INITIAL_REGION = {
  latitude: 43.0745,
  longitude: -89.4045,
  latitudeDelta: 0.016,
  longitudeDelta: 0.016
};

/**
 * One spot on the map: a category-colored circle with a crowding dot.
 *
 * The wrapper is deliberately larger than the circle. A marker's children are
 * rasterised into a bitmap of exactly the view's bounds, so anything reaching
 * past them — the status dot, the border, the shadow — gets cut off. The spare
 * padding is what keeps the circle round and the dot whole.
 */
function SpotMarker({
  spot,
  status,
  active,
  onPress
}: {
  spot: Spot;
  status: StatusMeta;
  active: boolean;
  onPress: () => void;
}) {
  // Re-rasterise when the marker's appearance changes, not on every frame.
  const tracking = useMarkerTracking(`${status.color}|${active}`);
  const cat = CAT[spot.cat];

  return (
    <Marker
      coordinate={{ latitude: spot.lat, longitude: spot.lng }}
      onPress={onPress}
      // Centre of the circle sits on the coordinate.
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracking}
      zIndex={active ? 20 : 10}
    >
      <View style={styles.markerWrap}>
        <View
          style={[styles.circle, { backgroundColor: cat.color }, active && styles.circleActive]}
        >
          <Ionicons name={cat.icon as never} size={15} color="#fff" />
        </View>
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
      </View>
    </Marker>
  );
}

/**
 * The campus map: Google Maps under the app's own markers.
 *
 * The basemap is styled down to streets and water (see MAP_STYLE) so it stays
 * a backdrop — buildings, business POIs and transit icons are all off, which
 * is what keeps the crowding markers readable at campus zoom.
 */
export function CampusMap({
  spots,
  selectedId,
  onSelect
}: {
  spots: Spot[];
  selectedId: string | null;
  onSelect: (spot: Spot) => void;
}) {
  const { statusOf, location } = useAppState();
  const tilt = useMapTilt();
  const meTracking = useMarkerTracking(`${location.origin.lat},${location.origin.lng}`);

  return (
    <View style={styles.container}>
      <MapView
        ref={tilt.ref}
        onMapReady={tilt.apply}
        style={StyleSheet.absoluteFill}
        provider={MAP_PROVIDER}
        customMapStyle={MAP_STYLE}
        initialRegion={INITIAL_REGION}
        showsPointsOfInterests={false}
        showsBuildings={false}
        showsIndoors={false}
        showsCompass={false}
        toolbarEnabled={false}
        // The app draws its own "you" dot when it has a real fix; Google's blue
        // dot would contradict it whenever we are on the campus fallback.
        showsUserLocation={false}
      >
        <Marker
          coordinate={{ latitude: location.origin.lat, longitude: location.origin.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={meTracking}
          title={location.label}
          zIndex={5}
        >
          <View style={styles.meWrap}>
            <View style={styles.me} />
          </View>
        </Marker>

        {spots.map((spot) => (
          <SpotMarker
            key={spot.id}
            spot={spot}
            status={statusOf(spot)}
            active={spot.id === selectedId}
            onPress={() => onSelect(spot)}
          />
        ))}
      </MapView>

      <View style={styles.legend} pointerEvents="none">
        <Text style={styles.legendTitle}>Reported now</Text>
        {(
          [
            ["Empty", colors.green],
            ["Some seats", colors.amber],
            ["Full", colors.uwRed]
          ] as const
        ).map(([label, color]) => (
          <View key={label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.mapLand
  },

  // 44pt wide for a 34pt circle: the spare 5pt on each side is what stops the
  // border, dot and shadow being clipped out of the rasterised bitmap.
  markerWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  circleActive: {
    borderColor: colors.ink,
    borderWidth: 3
  },
  statusDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff"
  },

  meWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  me: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.blue,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },

  legend: {
    position: "absolute",
    left: 12,
    bottom: 14,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    gap: 4,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  legendTitle: {
    ...overline,
    fontSize: 9,
    lineHeight: 13,
    marginBottom: 2
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted
  }
});
