import type { Mode } from "./constants";

/**
 * Cities, and which modes exist between any two of them. The modes come from geography, not from a list of
 * lanes: air runs between any two cities, sea between two coastal cities, road between two cities with road
 * access on the same landmass, and rail between two cities on the same rail network. Distance limits keep the
 * result believable. All lanes, distances and prices are invented demo data.
 */
export type Region =
  | "Central Asia"
  | "Caucasus and Turkey"
  | "Europe"
  | "Middle East"
  | "South Asia"
  | "East Asia"
  | "North America"
  | "Africa";

export const REGION_ORDER: Region[] = [
  "Central Asia",
  "Caucasus and Turkey",
  "Europe",
  "Middle East",
  "South Asia",
  "East Asia",
  "North America",
  "Africa",
];

export type City = {
  /** Airport code. Also the id of the city everywhere in the app. */
  code: string;
  name: string;
  country: string;
  countryCode: string;
  region: Region;
  lat: number;
  lon: number;
  /** Has an ocean port. Landlocked cities, and cities on a closed sea, never get sea freight. */
  coastal: boolean;
  landmass: "EURASIA" | "NORTH_AMERICA" | "AFRICA";
  /** Road access to the long-distance road network. False for islands and peninsulas cut off by water. */
  land: boolean;
  /** Rail network the city is on. Rail only runs between cities on the same network. */
  railNet?: "NORTH" | "SOUTH" | "NORTH_AMERICA";
};

const c = (
  code: string, name: string, country: string, countryCode: string, region: Region, lat: number, lon: number,
  extra: Partial<Pick<City, "coastal" | "landmass" | "land" | "railNet">> = {},
): City => ({ code, name, country, countryCode, region, lat, lon, coastal: false, landmass: "EURASIA", land: true, ...extra });

const N = { railNet: "NORTH" as const };

export const CITIES: City[] = [
  // Central Asia
  c("TAS", "Tashkent", "Uzbekistan", "UZ", "Central Asia", 41.3, 69.27, N),
  c("SKD", "Samarkand", "Uzbekistan", "UZ", "Central Asia", 39.65, 66.96, N),
  c("ALA", "Almaty", "Kazakhstan", "KZ", "Central Asia", 43.24, 76.89, N),
  c("NQZ", "Astana", "Kazakhstan", "KZ", "Central Asia", 51.17, 71.45, N),
  c("FRU", "Bishkek", "Kyrgyzstan", "KG", "Central Asia", 42.87, 74.59, N),
  c("DYU", "Dushanbe", "Tajikistan", "TJ", "Central Asia", 38.56, 68.79, N),
  c("ASB", "Ashgabat", "Turkmenistan", "TM", "Central Asia", 37.96, 58.33, N),
  // Caucasus and Turkey
  c("GYD", "Baku", "Azerbaijan", "AZ", "Caucasus and Turkey", 40.41, 49.87, N), // on the Caspian, a closed sea
  c("TBS", "Tbilisi", "Georgia", "GE", "Caucasus and Turkey", 41.72, 44.79, N),
  c("IST", "Istanbul", "Turkey", "TR", "Caucasus and Turkey", 41.01, 28.98, { ...N, coastal: true }),
  c("ESB", "Ankara", "Turkey", "TR", "Caucasus and Turkey", 39.93, 32.86, N),
  // Europe
  c("SVO", "Moscow", "Russia", "RU", "Europe", 55.75, 37.62, N),
  c("WAW", "Warsaw", "Poland", "PL", "Europe", 52.23, 21.01, N),
  c("FRA", "Frankfurt", "Germany", "DE", "Europe", 50.11, 8.68, N),
  c("HAM", "Hamburg", "Germany", "DE", "Europe", 53.55, 9.99, { ...N, coastal: true }),
  c("RTM", "Rotterdam", "Netherlands", "NL", "Europe", 51.92, 4.48, { ...N, coastal: true }),
  c("LHR", "London", "United Kingdom", "GB", "Europe", 51.51, -0.13, { coastal: true, land: false }),
  // Middle East
  c("DXB", "Dubai", "United Arab Emirates", "AE", "Middle East", 25.2, 55.27, { coastal: true }),
  c("DOH", "Doha", "Qatar", "QA", "Middle East", 25.29, 51.53, { coastal: true }),
  c("IKA", "Tehran", "Iran", "IR", "Middle East", 35.69, 51.39, N),
  c("RUH", "Riyadh", "Saudi Arabia", "SA", "Middle East", 24.71, 46.68),
  // South Asia
  c("DEL", "Delhi", "India", "IN", "South Asia", 28.61, 77.21, { railNet: "SOUTH" }),
  c("BOM", "Mumbai", "India", "IN", "South Asia", 19.08, 72.88, { railNet: "SOUTH", coastal: true }),
  c("KHI", "Karachi", "Pakistan", "PK", "South Asia", 24.86, 67.01, { railNet: "SOUTH", coastal: true }),
  // East Asia
  c("URC", "Urumqi", "China", "CN", "East Asia", 43.83, 87.62, N),
  c("PEK", "Beijing", "China", "CN", "East Asia", 39.9, 116.41, N),
  c("PVG", "Shanghai", "China", "CN", "East Asia", 31.23, 121.47, { ...N, coastal: true }),
  c("CAN", "Guangzhou", "China", "CN", "East Asia", 23.13, 113.26, { ...N, coastal: true }),
  c("ICN", "Seoul", "South Korea", "KR", "East Asia", 37.57, 126.98, { coastal: true, land: false }),
  // North America
  c("JFK", "New York", "United States", "US", "North America", 40.71, -74.01, { landmass: "NORTH_AMERICA", railNet: "NORTH_AMERICA", coastal: true }),
  c("LAX", "Los Angeles", "United States", "US", "North America", 34.05, -118.24, { landmass: "NORTH_AMERICA", railNet: "NORTH_AMERICA", coastal: true }),
  // Africa
  c("CAI", "Cairo", "Egypt", "EG", "Africa", 30.04, 31.24, { landmass: "AFRICA" }),
];

export const cityByCode = (code: string | null | undefined) => CITIES.find((x) => x.code === code);
export const cityName = (code: string) => cityByCode(code)?.name ?? code;

export type Country = { code: string; name: string };
/** Countries that have at least one city, sorted by name. */
export const COUNTRIES: Country[] = [...new Map(CITIES.map((x) => [x.countryCode, { code: x.countryCode, name: x.country }])).values()].sort((a, b) => a.name.localeCompare(b.name));
export const citiesInCountry = (countryCode: string) => CITIES.filter((x) => x.countryCode === countryCode);

/* ---------- Distance and modes ---------- */

const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km. */
export function distanceKm(a: string, b: string): number {
  const from = cityByCode(a);
  const to = cityByCode(b);
  if (!from || !to) return 4000;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}

/** Longest lane a truck or a train is offered on. */
export const MAX_ROAD_KM = 6500;
export const MAX_RAIL_KM = 10500;

/** Modes that exist between two cities, in display order. Empty when the cities are the same. */
export function modesBetween(origin: string, destination: string): Mode[] {
  const from = cityByCode(origin);
  const to = cityByCode(destination);
  if (!from || !to || origin === destination) return [];
  const km = distanceKm(origin, destination);
  const modes: Mode[] = ["AIR"];
  if (from.coastal && to.coastal) modes.push("SEA");
  if (from.railNet && from.railNet === to.railNet && km <= MAX_RAIL_KM) modes.push("RAIL");
  if (from.land && to.land && from.landmass === to.landmass && km <= MAX_ROAD_KM) modes.push("ROAD");
  return modes;
}

/** Cities a shipment can go to from an origin. */
export const destinationsFrom = (origin: string) =>
  CITIES.filter((x) => x.code !== origin && modesBetween(origin, x.code).length > 0);

/** The destinations most worth showing first: the most modes, then the nearest. */
export function popularFrom(origin: string, limit = 5): City[] {
  return destinationsFrom(origin)
    .map((x) => ({ city: x, modes: modesBetween(origin, x.code).length, km: distanceKm(origin, x.code) }))
    .sort((p, q) => q.modes - p.modes || p.km - q.km)
    .slice(0, limit)
    .map((p) => p.city);
}

/** Case-insensitive match on the city, the country or the code. */
export function searchCities(list: City[], query: string): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((x) => x.name.toLowerCase().includes(q) || x.country.toLowerCase().includes(q) || x.code.toLowerCase() === q);
}

/** Group cities by region, in the display order of the regions. Empty regions are left out. */
export function groupByRegion(list: City[]): { region: Region; cities: City[] }[] {
  return REGION_ORDER.map((region) => ({ region, cities: list.filter((x) => x.region === region) })).filter((g) => g.cities.length > 0);
}
