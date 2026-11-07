/** Map helpers for delivery pins (UAE only). */
export type LatLng = { lat: number; lng: number };

/** Where the map opens for each emirate (city centre). */
export const EMIRATE_CENTRES: Record<string, LatLng> = {
  "abu-dhabi": { lat: 24.4539, lng: 54.3773 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  sharjah: { lat: 25.3463, lng: 55.4209 },
  ajman: { lat: 25.4052, lng: 55.5136 },
  "umm-al-quwain": { lat: 25.5647, lng: 55.5552 },
  "ras-al-khaimah": { lat: 25.8007, lng: 55.9762 },
  fujairah: { lat: 25.1288, lng: 56.3265 },
};
export const UAE_CENTRE: LatLng = { lat: 24.9, lng: 55.0 };

/** Inside the UAE (generous box around the country). */
export const inUae = (p: { lat: unknown; lng: unknown }) =>
  typeof p.lat === "number" &&
  typeof p.lng === "number" &&
  Number.isFinite(p.lat) &&
  Number.isFinite(p.lng) &&
  p.lat >= 22.5 &&
  p.lat <= 26.5 &&
  p.lng >= 51.0 &&
  p.lng <= 56.6;

/** Link that opens the pin in Google Maps (works without any API key — for customers and drivers). */
export const googleMapsLink = (p: LatLng) =>
  `https://www.google.com/maps/search/?api=1&query=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
