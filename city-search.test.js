import test from "node:test";
import assert from "node:assert/strict";
import { searchCities } from "./city-search.js";

test("city search uses a submitted name and reads WGS 84 results", async () => {
  let requested;
  const places = await searchCities("Paris, France", async (url) => {
    requested = url;
    return {
      ok: true,
      async json() {
        return { results: [
          { id: 1, name: "Paris", admin1: "Île-de-France", country: "France", latitude: 48.8534, longitude: 2.3488 },
          { id: 2, name: "Invalid", latitude: 100, longitude: 0 },
        ] };
      },
    };
  });
  assert.equal(requested.searchParams.get("name"), "Paris, France");
  assert.equal(requested.searchParams.get("count"), "5");
  assert.deepEqual(places, [{ id: 1, name: "Paris", admin1: "Île-de-France", country: "France", latitude: 48.8534, longitude: 2.3488 }]);
});

test("city search reports short queries and service errors", async () => {
  await assert.rejects(() => searchCities("P", () => {}), /two characters/);
  await assert.rejects(() => searchCities("Paris", async () => ({ ok: false })), /unavailable/);
});
