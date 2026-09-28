const SEARCH_URL = "https://geocoding-api.open-meteo.com/v1/search";

/** Search for cities using Open-Meteo's WGS 84 geocoding endpoint. */
export async function searchCities(query, fetcher = fetch) {
  const name = String(query ?? "").trim();
  if (name.length < 2) throw new Error("Enter at least two characters for a city.");

  const url = new URL(SEARCH_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetcher(url);
  if (!response.ok) throw new Error("City search is unavailable right now. Try again later.");

  const data = await response.json();
  if (!Array.isArray(data.results)) return [];

  return data.results
    .filter((place) =>
      typeof place.name === "string" &&
      Number.isFinite(place.latitude) && Math.abs(place.latitude) <= 90 &&
      Number.isFinite(place.longitude) && Math.abs(place.longitude) <= 180)
    .map(({ id, name, admin1, country, latitude, longitude }) => ({
      id, name, admin1, country, latitude, longitude,
    }));
}
