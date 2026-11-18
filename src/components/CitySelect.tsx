"use client";

import { useState } from "react";
import { CITIES, COUNTRIES, cityByCode, citiesInCountry, type City } from "@/lib/places";
import { Field } from "./Field";

/** A city list grouped by country. Plain and fast, so it suits a field people rarely change. */
export function CitySelect({
  id,
  value,
  onChange,
  cities = CITIES,
  placeholder,
  invalid = false,
}: {
  id: string;
  value: string;
  onChange: (code: string) => void;
  cities?: City[];
  placeholder?: string;
  invalid?: boolean;
}) {
  const groups = [...new Set(cities.map((c) => c.country))]
    .sort((a, b) => a.localeCompare(b))
    .map((country) => ({ country, cities: cities.filter((c) => c.country === country) }));
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid}>
      {placeholder && <option value="">{placeholder}</option>}
      {groups.map((g) => (
        <optgroup key={g.country} label={g.country}>
          {g.cities.map((c) => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/**
 * Country first, then city. The city list only shows that country's cities, and a country with one
 * city fills the city in for you.
 */
export function CountryCitySelect({
  idPrefix = "",
  value,
  onChange,
  error,
}: {
  idPrefix?: string;
  /** The chosen city code, or an empty string. */
  value: string;
  onChange: (cityCode: string) => void;
  error?: string;
}) {
  const [country, setCountry] = useState(cityByCode(value)?.countryCode ?? "");
  const options = country ? citiesInCountry(country) : [];

  return (
    <>
      <Field id={`${idPrefix}country`} label="Country">
        <select
          id={`${idPrefix}country`}
          value={country}
          onChange={(e) => {
            const next = e.target.value;
            setCountry(next);
            const list = next ? citiesInCountry(next) : [];
            onChange(list.length === 1 ? list[0].code : "");
          }}
        >
          <option value="">Choose a country</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </Field>
      <Field id={`${idPrefix}city`} label="City" error={error} hint={country ? undefined : "Choose a country first."}>
        <select id={`${idPrefix}city`} value={value} disabled={!country} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
          <option value="">{country ? "Choose a city" : "Choose a country first"}</option>
          {options.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
        </select>
      </Field>
    </>
  );
}
