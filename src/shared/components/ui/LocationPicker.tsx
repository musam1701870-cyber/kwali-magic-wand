// Client-only interactive map for capturing/confirming a real location.
// Leaflet JS is imported dynamically so it never runs during SSR; the CSS is a
// static side-effect import (collected by Vite, no browser APIs executed).
import { useEffect, useRef, useState, type FormEvent } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Search, Map as MapIcon } from "lucide-react";
import {
  KWALI_CENTER,
  MAPTILER_ATTRIBUTION,
  type MapStyle,
  maptilerTileUrl,
  hasMapKey,
  reverseGeocode,
  forwardGeocode,
} from "@/shared/lib/maptiler";

export type LatLng = { lat: number; lng: number };
export type LocationMeta = { placeName?: string; ward?: string };

type Props = {
  value: LatLng | null;
  onChange: (v: LatLng, meta?: LocationMeta) => void;
  height?: number;
  center?: LatLng;
  className?: string;
};

const PIN_HTML = `
<div style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));transform:translateZ(0)">
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C7 0 3 4 3 9c0 6.2 9 15 9 15s9-8.8 9-15c0-5-4-9-9-9z" fill="#0f7a4f"/>
    <circle cx="12" cy="9" r="3.2" fill="#ffffff"/>
  </svg>
</div>`;

export function LocationPicker({ value, onChange, height = 320, center, className }: Props) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [style, setStyle] = useState<MapStyle>("streets-v2");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const markerRef = useRef<LeafletNS.Marker | null>(null);
  const tileRef = useRef<LeafletNS.TileLayer | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => setMounted(true), []);

  // Propagate a chosen coordinate upward, then enrich with a reverse-geocoded name/ward.
  const commit = useRef(async (lat: number, lng: number) => {
    const rounded = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
    onChangeRef.current(rounded);
    const geo = await reverseGeocode(rounded.lat, rounded.lng);
    if (geo.placeName) setPlaceName(geo.placeName);
    onChangeRef.current(rounded, geo);
  });
  // Build the map once, after client mount.
  useEffect(() => {
    if (!mounted || !containerRef.current || mapRef.current || !hasMapKey) return;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const start = value ?? center ?? KWALI_CENTER;
      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom: value ? 16 : 12,
        zoomControl: true,
      });
      mapRef.current = map;

      const tile = L.tileLayer(maptilerTileUrl(style), {
        attribution: MAPTILER_ATTRIBUTION,
        tileSize: 512,
        zoomOffset: -1,
        minZoom: 3,
        maxZoom: 20,
        crossOrigin: true,
      });
      tile.on("tileerror", () =>
        setNote("Map tiles failed to load — you can still set coordinates manually."),
      );
      tile.addTo(map);
      tileRef.current = tile;

      const icon = L.divIcon({
        html: PIN_HTML,
        className: "",
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });
      const marker = L.marker([start.lat, start.lng], { draggable: true, icon });
      marker.addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        void commit.current(ll.lat, ll.lng);
      });
      map.on("click", (e: LeafletNS.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        void commit.current(e.latlng.lat, e.latlng.lng);
      });

      setReady(true);
      // Container starts hidden inside wizard steps; recalc size once painted.
      setTimeout(() => map.invalidateSize(), 120);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        tileRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Sync externally-set coordinates (e.g. "use my location") onto the map.
  useEffect(() => {
    if (!ready || !value || !mapRef.current || !markerRef.current) return;
    const cur = markerRef.current.getLatLng();
    if (Math.abs(cur.lat - value.lat) > 1e-6 || Math.abs(cur.lng - value.lng) > 1e-6) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      mapRef.current.setView([value.lat, value.lng], Math.max(mapRef.current.getZoom() ?? 15, 15));
    }
  }, [value, ready]);

  // Swap tile style without rebuilding the map.
  useEffect(() => {
    if (tileRef.current) tileRef.current.setUrl(maptilerTileUrl(style));
  }, [style]);

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNote("Geolocation is not supported on this device.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        void commit.current(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setBusy(false);
        setNote(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied."
            : "Could not get your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function runSearch(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setNote(null);
    const hits = await forwardGeocode(q);
    setBusy(false);
    const hit = hits[0];
    if (hit?.lat != null && hit?.lng != null) {
      void commit.current(hit.lat, hit.lng);
      if (hit.placeName) setPlaceName(hit.placeName);
    } else {
      setNote(`No match for “${q}”. Try a nearby landmark, or drop the pin manually.`);
    }
  }
  // Server + first paint: a deterministic sized skeleton (map builds only after mount).
  if (!mounted) {
    return (
      <div className={className}>
        <div
          className="w-full animate-pulse rounded-xl border border-border bg-secondary/40"
          style={{ height }}
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {hasMapKey ? (
        <>
          {/* Toolbar: search · locate · basemap toggle */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <form onSubmit={runSearch} className="flex min-w-[180px] flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search a landmark or address…"
                  className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-sm text-ink"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                Search
              </button>
            </form>
            <button
              type="button"
              onClick={locate}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50"
            >
              <LocateFixed className="h-4 w-4" /> Use my location
            </button>
            <div className="inline-flex overflow-hidden rounded-md border border-border">
              <button
                type="button"
                onClick={() => setStyle("streets-v2")}
                className={
                  "px-3 py-2 text-xs font-semibold " +
                  (style === "streets-v2"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-secondary")
                }
              >
                Streets
              </button>
              <button
                type="button"
                onClick={() => setStyle("hybrid")}
                className={
                  "inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold " +
                  (style === "hybrid"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-secondary")
                }
              >
                <MapIcon className="h-3.5 w-3.5" /> Satellite
              </button>
            </div>
          </div>

          {/* Interactive map */}
          <div className="relative overflow-hidden rounded-xl border border-border">
            <div ref={containerRef} style={{ height }} className="w-full" />
            {!ready && (
              <div className="absolute inset-0 grid place-items-center bg-secondary/40 text-sm text-muted-foreground">
                Loading map…
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Tap the map or drag the pin to mark the exact spot.
          </p>
          {value && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </p>
          )}
        </>
      ) : (
        // No key / offline: keep coordinate capture working via manual entry.
        <div
          className="rounded-xl border-2 border-dashed border-border bg-secondary/30 p-6 text-center"
          style={{ minHeight: height }}
        >
          <MapIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-ink">Interactive map unavailable</p>
          <p className="text-xs text-muted-foreground">Enter the coordinates manually below.</p>
          <div className="mx-auto mt-4 grid max-w-md gap-3 text-left sm:grid-cols-2">
            <label className="text-xs font-medium text-muted-foreground">
              Latitude
              <input
                type="number"
                step="0.000001"
                value={value?.lat ?? ""}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  if (!Number.isNaN(lat)) void commit.current(lat, value?.lng ?? KWALI_CENTER.lng);
                }}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Longitude
              <input
                type="number"
                step="0.000001"
                value={value?.lng ?? ""}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value);
                  if (!Number.isNaN(lng)) void commit.current(value?.lat ?? KWALI_CENTER.lat, lng);
                }}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-ink"
              />
            </label>
          </div>
        </div>
      )}

      {placeName && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          <span aria-hidden>📍</span>
          <span>
            Near: <span className="font-semibold">{placeName}</span>
          </span>
        </div>
      )}
      {note && <p className="mt-2 text-xs text-destructive">{note}</p>}
    </div>
  );
}
