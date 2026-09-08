import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { CATEGORY_META } from "@/data/categories";
import { STUDY_SPOTS } from "@/data/spots";

// Centered on the UW–Madison campus, same starting view as the website map.
const INITIAL_REGION = {
  latitude: 43.0735,
  longitude: -89.4055,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05
};

export default function MapScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={INITIAL_REGION}>
        {STUDY_SPOTS.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.lat, longitude: spot.lng }}
            title={spot.name}
            description={spot.address}
            pinColor={CATEGORY_META[spot.category].color}
            onCalloutPress={() => router.push(`/spot/${spot.id}`)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
