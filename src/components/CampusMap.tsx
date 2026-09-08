import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { CAT } from "@/data/categories";
import { MAP_STYLE } from "@/data/mapStyle";
import { MAP_PROVIDER } from "@/lib/mapProvider";
import { trace, traceError } from "@/lib/trace";
import { useAppState } from "@/state/appState";
import { colors, fonts, overline } from "@/theme";
import type { Spot } from "@/types/spot";

// Frames the isthmus campus — Union South through the Memorial Union Terrace.
// Tight enough that local streets are already drawn at first paint.
const INITIAL_REGION = {
  latitude: 43.0745,
  longitude: -89.4045,
  latitudeDelta: 0.016,
  longitudeDelta: 0.016
};

/**
 * The campus map: Google Maps under the design's own pins.
 *
 * The basemap is styled down to streets and water (see MAP_STYLE) so it stays
 * a backdrop — buildings, business POIs and transit icons are all off, which
 * is what keeps the crowding pins readable at campus zoom.
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
  trace("CampusMap render", `provider=${MAP_PROVIDER ?? "default(apple)"} spots=${spots.length}`);

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        // A view with no height initialises and reports ready while showing
        // nothing, which looks identical to a crash.
        trace(
          "CampusMap container layout",
          `${Math.round(width)}x${Math.round(height)}${height < 1 ? "  <-- ZERO HEIGHT" : ""}`
        );
      }}
    >
      <MapView
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
        onMapReady={() => trace("CampusMap onMapReady")}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          trace(
            "CampusMap MapView layout",
            `${Math.round(width)}x${Math.round(height)}${height < 1 ? "  <-- ZERO HEIGHT" : ""}`
          );
        }}
      >
        <Marker
          coordinate={{ latitude: location.origin.lat, longitude: location.origin.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          title={location.label}
        >
          <View style={styles.me} />
        </Marker>

        {spots.map((spot) => {
          const cat = CAT[spot.cat];
          const status = statusOf(spot);
          const active = spot.id === selectedId;
          return (
            <Marker
              key={spot.id}
              coordinate={{ latitude: spot.lat, longitude: spot.lng }}
              onPress={() => onSelect(spot)}
              // Keep the teardrop's point on the coordinate, not its centre.
              anchor={{ x: 0.5, y: 1 }}
              // Re-render only when the pin's own appearance changes, so the
              // markers are not rasterised on every pan.
              tracksViewChanges={active}
            >
              <View style={styles.pinWrap}>
                <View
                  style={[styles.pin, { backgroundColor: cat.color }, active && styles.pinActive]}
                >
                  <Ionicons
                    name={cat.icon as never}
                    size={11}
                    color="#fff"
                    style={styles.pinIcon}
                  />
                </View>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              </View>
            </Marker>
          );
        })}
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
  me: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.blue,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  pinWrap: {
    width: 34,
    height: 38,
    alignItems: "center"
  },
  pin: {
    width: 30,
    height: 30,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 0,
    transform: [{ rotate: "-45deg" }],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
  },
  pinActive: {
    transform: [{ rotate: "-45deg" }, { scale: 1.2 }]
  },
  pinIcon: {
    transform: [{ rotate: "45deg" }]
  },
  statusDot: {
    position: "absolute",
    top: -3,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff"
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
    color: colors.muted
  }
});
