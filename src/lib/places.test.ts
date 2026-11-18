import { describe, expect, it } from "vitest";
import {
  CITIES,
  COUNTRIES,
  MAX_RAIL_KM,
  MAX_ROAD_KM,
  citiesInCountry,
  cityByCode,
  destinationsFrom,
  distanceKm,
  groupByRegion,
  modesBetween,
  popularFrom,
  searchCities,
} from "./places";

describe("the city list", () => {
  it("has unique city codes and every field filled", () => {
    expect(new Set(CITIES.map((x) => x.code)).size).toBe(CITIES.length);
    for (const x of CITIES) {
      expect(x.code).toMatch(/^[A-Z]{3}$/);
      expect(x.name.length).toBeGreaterThan(1);
      expect(x.countryCode).toMatch(/^[A-Z]{2}$/);
    }
  });
  it("keeps the cities the earlier demo data uses", () => {
    for (const code of ["TAS", "ALA", "IST", "DXB", "PVG", "HAM"]) expect(cityByCode(code), code).toBeDefined();
  });
  it("lists countries once each, sorted, and finds their cities", () => {
    const names = COUNTRIES.map((x) => x.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(citiesInCountry("UZ").map((x) => x.code).sort()).toEqual(["SKD", "TAS"]);
    expect(citiesInCountry("TR").length).toBe(2);
  });
});

describe("distance", () => {
  it("is the same in both directions and zero to itself", () => {
    expect(distanceKm("TAS", "IST")).toBe(distanceKm("IST", "TAS"));
    expect(distanceKm("TAS", "TAS")).toBe(0);
  });
  it("is believable", () => {
    expect(distanceKm("TAS", "ALA")).toBeGreaterThan(600);
    expect(distanceKm("TAS", "ALA")).toBeLessThan(900);
    expect(distanceKm("JFK", "LAX")).toBeGreaterThan(3800);
    expect(distanceKm("JFK", "LAX")).toBeLessThan(4100);
  });
});

describe("modes come from geography", () => {
  it("inland cities never get sea, coastal pairs always do", () => {
    for (const a of CITIES) for (const b of CITIES) {
      if (a.code === b.code) continue;
      expect(modesBetween(a.code, b.code).includes("SEA"), `${a.code}-${b.code}`).toBe(a.coastal && b.coastal);
    }
  });
  it("Baku is on a closed sea, so it gets no sea freight", () => {
    expect(modesBetween("GYD", "IST")).not.toContain("SEA");
  });
  it("islands and cut-off peninsulas get no road", () => {
    expect(modesBetween("LHR", "FRA")).not.toContain("ROAD");
    expect(modesBetween("ICN", "PEK")).not.toContain("ROAD");
  });
  it("road and rail respect the distance limits", () => {
    for (const a of CITIES) for (const b of CITIES) {
      if (a.code === b.code) continue;
      const modes = modesBetween(a.code, b.code);
      if (modes.includes("ROAD")) expect(distanceKm(a.code, b.code)).toBeLessThanOrEqual(MAX_ROAD_KM);
      if (modes.includes("RAIL")) expect(distanceKm(a.code, b.code)).toBeLessThanOrEqual(MAX_RAIL_KM);
    }
  });
  it("different landmasses share no road", () => {
    expect(modesBetween("JFK", "FRA")).toEqual(["AIR"].concat(modesBetween("JFK", "FRA").includes("SEA") ? ["SEA"] : []));
    expect(modesBetween("CAI", "IST")).not.toContain("ROAD");
  });
  it("rail only runs on one rail network", () => {
    expect(modesBetween("TAS", "DEL")).not.toContain("RAIL"); // north network to south network
    expect(modesBetween("DEL", "KHI")).toContain("RAIL");
    expect(modesBetween("JFK", "LAX")).toContain("RAIL");
  });
  it("every city can reach every other by air, in both directions", () => {
    for (const a of CITIES) for (const b of CITIES) {
      if (a.code === b.code) continue;
      expect(modesBetween(a.code, b.code)).toContain("AIR");
      expect(modesBetween(a.code, b.code).sort()).toEqual(modesBetween(b.code, a.code).sort());
    }
  });
  it("the pilot lanes from Tashkent are unchanged", () => {
    expect(modesBetween("TAS", "IST")).toEqual(["AIR", "RAIL", "ROAD"]);
    expect(modesBetween("TAS", "DXB")).toEqual(["AIR", "ROAD"]);
    expect(modesBetween("TAS", "ALA")).toEqual(["AIR", "RAIL", "ROAD"]);
  });
});

describe("the destination picker helpers", () => {
  it("lists every other city as a destination", () => {
    expect(destinationsFrom("TAS").length).toBe(CITIES.length - 1);
    expect(destinationsFrom("TAS").map((x) => x.code)).not.toContain("TAS");
  });
  it("finds cities by name, country or code, ignoring case", () => {
    expect(searchCities(CITIES, "istanb").map((x) => x.code)).toEqual(["IST"]);
    expect(searchCities(CITIES, "istan").map((x) => x.code)).toContain("TAS"); // matches the country, Uzbekistan
    expect(searchCities(CITIES, "KAZAKH").map((x) => x.code).sort()).toEqual(["ALA", "NQZ"]);
    expect(searchCities(CITIES, "dxb").map((x) => x.code)).toEqual(["DXB"]);
    expect(searchCities(CITIES, "  ").length).toBe(CITIES.length);
    expect(searchCities(CITIES, "zzzz")).toEqual([]);
  });
  it("groups by region in display order and drops empty regions", () => {
    const groups = groupByRegion(CITIES.filter((x) => x.region === "Europe" || x.region === "Central Asia"));
    expect(groups.map((g) => g.region)).toEqual(["Central Asia", "Europe"]);
  });
  it("puts the best connected, nearest destinations first", () => {
    const popular = popularFrom("TAS", 5);
    expect(popular.length).toBe(5);
    const modes = popular.map((x) => modesBetween("TAS", x.code).length);
    expect(modes).toEqual([...modes].sort((a, b) => b - a));
    expect(popular.map((x) => x.code)).not.toContain("TAS");
  });
});
