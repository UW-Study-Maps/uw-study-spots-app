export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Decodes an encoded polyline.
 *
 * Both providers here use the same algorithm at different scales: Transit's
 * route shapes are the classic 5-decimal form, Valhalla's are 6. Passing the
 * wrong precision does not fail loudly — it returns coordinates off by a factor
 * of ten — so callers name it explicitly.
 */
export function decodePolyline(encoded: string, precision: number): LatLng[] {
  const factor = 10 ** precision;
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / factor, lng: lng / factor });
  }

  return points;
}

/** Great-circle distance in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Index of the point in `path` closest to `target`. */
export function nearestIndex(path: LatLng[], target: LatLng): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = distanceMeters(path[i], target);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
}

/**
 * The stretch of `path` between the two points, inclusive.
 *
 * Used to cut a single bus leg out of a whole route's shape. If the boarding
 * point resolves later along the shape than the alighting point — which happens
 * on loop routes that pass a stop twice — the slice is reversed so the drawn
 * line still runs the way the rider travels.
 */
export function slicePath(path: LatLng[], from: LatLng, to: LatLng): LatLng[] {
  if (path.length === 0) return [from, to];
  const start = nearestIndex(path, from);
  const end = nearestIndex(path, to);
  if (start === end) return [from, to];

  const slice =
    start < end ? path.slice(start, end + 1) : path.slice(end, start + 1).reverse();
  if (slice.length < 2) return [from, to];

  // Shape vertices are sparse on some routes — snapping can land 100 m short of
  // the stop — so pin the ends to the real stop positions. Points already close
  // enough to be the same place are dropped rather than doubled up.
  const SNAP_TOLERANCE_METERS = 15;
  const head = distanceMeters(slice[0], from) > SNAP_TOLERANCE_METERS ? [from] : [];
  const tail =
    distanceMeters(slice[slice.length - 1], to) > SNAP_TOLERANCE_METERS ? [to] : [];
  return [...head, ...slice, ...tail];
}
