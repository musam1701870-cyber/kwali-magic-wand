// MapTiler configuration + geocoding helpers for the Kwali Revenue Platform.
// Client key is browser-public by design (restrict by domain in the MapTiler dashboard).
// Follows the import.meta.env.VITE_* convention used in integrations/supabase/client.ts.
import { wards } from "@/shared/lib/kwali-mock";

export const MAPTILER_KEY =
  (import.meta.env.VITE_MAPTILER_API_KEY as string | undefined) ||
  (typeof process !== "undefined" ? process.env?.MAPTILER_API_KEY : undefined) ||
  "";

export const hasMapKey = MAPTILER_KEY.length > 0;

// Kwali Area Council town centre — sensible default map view.
export const KWALI_CENTER = { lat: 8.879, lng: 7.001 } as const;

export type MapStyle = "streets-v2" | "hybrid";

/** Raster XYZ tile template for a Leaflet L.tileLayer. */
export function maptilerTileUrl(style: MapStyle = "streets-v2") {
  return `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
}

export const MAPTILER_ATTRIBUTION =
  '© <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

export type GeoResult = {
  placeName?: string;
  ward?: string;
  lat?: number;
  lng?: number;
};

// Match any Kwali ward name appearing in a free-text string (place name / context labels).
function matchWard(...texts: (string | undefined)[]): string | undefined {
  const hay = texts.filter(Boolean).join(" ").toLowerCase();
  return wards.find((w) => hay.includes(w.toLowerCase()));
}

/** Reverse geocode a coordinate → nearest place name + best-effort Kwali ward. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  if (!hasMapKey) return {};
  try {
    const res = await fetch(
      `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}`,
    );
    if (!res.ok) return {};
    const data = await res.json();
    const feat = data?.features?.[0];
    if (!feat) return {};
    const contextText = Array.isArray(feat.context)
      ? feat.context.map((c: { text?: string }) => c.text).join(" ")
      : "";
    return {
      placeName: feat.place_name || feat.text,
      ward: matchWard(feat.text, feat.place_name, contextText),
    };
  } catch {
    return {};
  }
}

/** Forward geocode an address/landmark query, biased toward Kwali. */
export async function forwardGeocode(query: string): Promise<GeoResult[]> {
  if (!hasMapKey || !query.trim()) return [];
  try {
    const res = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json` +
        `?key=${MAPTILER_KEY}&proximity=${KWALI_CENTER.lng},${KWALI_CENTER.lat}&country=ng&limit=5`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.features)) return [];
    return data.features.map(
      (feat: {
        place_name?: string;
        text?: string;
        center?: [number, number];
        context?: { text?: string }[];
      }) => {
        const contextText = Array.isArray(feat.context)
          ? feat.context.map((c) => c.text).join(" ")
          : "";
        return {
          placeName: feat.place_name || feat.text,
          ward: matchWard(feat.text, feat.place_name, contextText),
          lng: feat.center?.[0],
          lat: feat.center?.[1],
        } as GeoResult;
      },
    );
  } catch {
    return [];
  }
}
