"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { googleMapsLink, type LatLng } from "@/lib/geo";

/**
 * Delivery location pin. Uses Google Maps when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set (go-live), and the
 * free OpenStreetMap map otherwise (laptop) — same behaviour: tap the map or drag the pin, or use the
 * phone's location. The pin is saved with the address so the driver can open it in Google Maps.
 */
type Labels = {
  title: string;
  help: string;
  useMyLocation: string;
  locating: string;
  locationDenied: string;
  pinSet: string;
  openMap: string;
};

/** Minimal shape of the map we drive (Leaflet or Google). */
type Driver = {
  setPin: (p: LatLng | null, zoom?: boolean) => void;
  centre: (p: LatLng) => void;
  destroy: () => void;
};

const PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" aria-hidden="true">' +
  '<path d="M18 1C8.6 1 1 8.6 1 18c0 12.4 15.2 27.6 15.9 28.3a1.5 1.5 0 0 0 2.2 0C19.8 45.6 35 30.4 35 18 35 8.6 27.4 1 18 1Z" fill="#0F3D2E" stroke="#C9A96E" stroke-width="2"/>' +
  '<circle cx="18" cy="18" r="6.5" fill="#C9A96E"/></svg>';

async function leafletDriver(
  el: HTMLElement,
  centre: LatLng,
  onPick: (p: LatLng) => void,
  alive: () => boolean,
): Promise<Driver | null> {
  const L = (await import("leaflet")).default;
  if (!alive()) return null; // the component was removed (or re-mounted) while loading
  const map = L.map(el, { center: [centre.lat, centre.lng], zoom: 11, zoomControl: true });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const icon = L.divIcon({ html: PIN_SVG, className: "", iconSize: [36, 48], iconAnchor: [18, 47] });
  let marker: ReturnType<typeof L.marker> | null = null;
  const setPin = (p: LatLng | null, zoom = false) => {
    if (!p) {
      marker?.remove();
      marker = null;
      return;
    }
    if (!marker) {
      marker = L.marker([p.lat, p.lng], { icon, draggable: true, keyboard: true }).addTo(map);
      marker.on("dragend", () => {
        const ll = marker!.getLatLng();
        onPick({ lat: ll.lat, lng: ll.lng });
      });
    } else marker.setLatLng([p.lat, p.lng]);
    if (zoom) map.setView([p.lat, p.lng], Math.max(map.getZoom(), 16));
  };
  map.on("click", (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }));
  return { setPin, centre: (p) => map.setView([p.lat, p.lng], 11), destroy: () => map.remove() };
}

type GLatLng = { lat(): number; lng(): number };
type GMapsApi = {
  Map: new (
    el: HTMLElement,
    o: Record<string, unknown>,
  ) => {
    addListener(ev: string, fn: (e: { latLng: GLatLng | null }) => void): void;
    setCenter(p: LatLng): void;
    setZoom(z: number): void;
    getZoom(): number;
  };
  marker: {
    AdvancedMarkerElement: new (o: Record<string, unknown>) => {
      position: LatLng | GLatLng | null;
      map: unknown;
      addListener(ev: string, fn: () => void): void;
    };
  };
};

let googleLoading: Promise<GMapsApi> | null = null;
function loadGoogle(key: string): Promise<GMapsApi> {
  const w = window as unknown as { google?: { maps: GMapsApi }; __nshMapsReady?: () => void };
  if (w.google?.maps?.marker) return Promise.resolve(w.google.maps);
  googleLoading ??= new Promise((resolve, reject) => {
    w.__nshMapsReady = () => resolve(w.google!.maps);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=marker&loading=async&callback=__nshMapsReady`;
    s.async = true;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
  return googleLoading;
}

async function googleDriver(
  el: HTMLElement,
  centre: LatLng,
  onPick: (p: LatLng) => void,
  key: string,
  mapId: string,
  lang: string,
  alive: () => boolean,
): Promise<Driver | null> {
  const g = await loadGoogle(key);
  if (!alive()) return null;
  const map = new g.Map(el, {
    center: centre,
    zoom: 11,
    mapId,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: true, // satellite view helps find villas and farms
    clickableIcons: false,
    language: lang,
  });
  const pinEl = document.createElement("div");
  pinEl.innerHTML = PIN_SVG;
  let marker: InstanceType<GMapsApi["marker"]["AdvancedMarkerElement"]> | null = null;
  const toLatLng = (p: LatLng | GLatLng): LatLng =>
    typeof (p as GLatLng).lat === "function"
      ? { lat: (p as GLatLng).lat(), lng: (p as GLatLng).lng() }
      : (p as LatLng);
  const setPin = (p: LatLng | null, zoom = false) => {
    if (!p) {
      if (marker) marker.map = null;
      marker = null;
      return;
    }
    if (!marker) {
      marker = new g.marker.AdvancedMarkerElement({ map, position: p, content: pinEl, gmpDraggable: true });
      marker.addListener("dragend", () => marker?.position && onPick(toLatLng(marker.position)));
    } else marker.position = p;
    if (zoom) {
      map.setCenter(p);
      map.setZoom(Math.max(map.getZoom(), 17));
    }
  };
  map.addListener("click", (e) => e.latLng && onPick(toLatLng(e.latLng)));
  return {
    setPin,
    centre: (p) => {
      map.setCenter(p);
      map.setZoom(11);
    },
    destroy: () => setPin(null),
  };
}

export function MapPin({
  value,
  centre,
  onChange,
  labels,
  lang,
  invalid = false,
}: {
  value: LatLng | null;
  /** Where to open the map when there is no pin yet (e.g. the chosen emirate). */
  centre: LatLng;
  onChange: (p: LatLng) => void;
  labels: Labels;
  lang: string;
  invalid?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const driver = useRef<Driver | null>(null);
  const pick = useRef(onChange);
  const [status, setStatus] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  useEffect(() => {
    pick.current = onChange;
  }, [onChange]);

  // Create the map once.
  useEffect(() => {
    if (!box.current) return;
    let cancelled = false;
    const el = box.current;
    const start = value ?? centre;
    const alive = () => !cancelled;
    const onPick = (p: LatLng) => pick.current(p);
    const make = googleKey
      ? googleDriver(el, start, onPick, googleKey, mapId, lang, alive).catch(() =>
          leafletDriver(el, start, onPick, alive),
        )
      : leafletDriver(el, start, onPick, alive);
    make.then((d) => {
      if (!d) return;
      if (cancelled) return d.destroy();
      driver.current = d;
      if (value) d.setPin(value, true);
    });
    return () => {
      cancelled = true;
      driver.current?.destroy();
      driver.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the map is created once; updates below
  }, []);

  useEffect(() => {
    driver.current?.setPin(value);
  }, [value]);

  useEffect(() => {
    if (!value) driver.current?.centre(centre);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the emirate changes
  }, [centre.lat, centre.lng]);

  function locate() {
    if (!navigator.geolocation) return setStatus(labels.locationDenied);
    setLocating(true);
    setStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        pick.current(p);
        driver.current?.setPin(p, true);
      },
      () => {
        setLocating(false);
        setStatus(labels.locationDenied);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="space-y-2" data-field="pin" data-bad={invalid || undefined}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-muted">{labels.title}</p>
          <p className="text-xs text-muted">{labels.help}</p>
        </div>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="min-h-11 rounded-brand border border-green px-3 text-sm font-semibold text-green hover:bg-green/5 disabled:opacity-60"
          data-testid="use-my-location"
        >
          {locating ? labels.locating : `📍 ${labels.useMyLocation}`}
        </button>
      </div>
      <div
        ref={box}
        className={`relative z-0 h-72 w-full overflow-hidden rounded-brand border bg-ivory-200 ${
          invalid ? "border-danger ring-2 ring-danger/30" : "border-line"
        }`}
        role="application"
        aria-label={labels.title}
        data-testid="map"
        data-pinned={value ? "true" : "false"}
      />
      {value ? (
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-green" data-testid="pin-set">
          <span>{labels.pinSet}</span>
          <a
            href={googleMapsLink(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-deep underline"
          >
            {labels.openMap}
          </a>
        </p>
      ) : null}
      {status ? (
        <p role="alert" className="text-sm text-danger">
          {status}
        </p>
      ) : null}
    </div>
  );
}
