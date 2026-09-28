import { searchCities } from "./city-search.js";

const mapElement = document.querySelector("#map");
const fallback = document.querySelector("#map-fallback");
const coordinateLabel = document.querySelector("#map-coordinate");
const message = document.querySelector("#map-message");
const searchForm = document.querySelector("#city-search-form");
const searchInput = document.querySelector("#city-query");
const searchButton = document.querySelector("#city-search-button");
const resultsList = document.querySelector("#city-results");
const searchCache = new Map();
const MAX_MAP_LATITUDE = 85.06;

function placeLabel(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

export function initMap(onSelect, initialLatitude, initialLongitude) {
  if (!window.L) {
    mapElement.hidden = true;
    fallback.hidden = false;
    searchForm.hidden = true;
    message.textContent = "Map library unavailable.";
    return {
      setPin(latitude, longitude) {
        coordinateLabel.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      },
    };
  }

  const leaflet = window.L;
  const map = leaflet.map(mapElement, {
    scrollWheelZoom: false,
    maxBounds: [[-MAX_MAP_LATITUDE, -180], [MAX_MAP_LATITUDE, 180]],
    maxBoundsViscosity: 1,
  }).setView([initialLatitude, initialLongitude], 11);

  leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    noWrap: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);

  const pinIcon = leaflet.divIcon({ className: "map-pin", iconSize: [30, 38], iconAnchor: [15, 37] });
  const marker = leaflet.marker([initialLatitude, initialLongitude], {
    draggable: true,
    keyboard: true,
    title: "Selected coordinate; drag to move",
    icon: pinIcon,
  }).addTo(map);

  function setPin(latitude, longitude, zoom = null) {
    coordinateLabel.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    if (Math.abs(latitude) > MAX_MAP_LATITUDE) {
      map.removeLayer(marker);
      message.textContent = "This latitude is outside the map's Web Mercator area (±85.06°).";
      return;
    }
    if (!map.hasLayer(marker)) marker.addTo(map);
    marker.setLatLng([latitude, longitude]);
    map.setView([latitude, longitude], zoom ?? map.getZoom(), { animate: false });
    if (message.textContent.includes("outside the map")) message.textContent = "";
  }

  function chooseLocation(latitude, longitude) {
    const safeLatitude = Math.max(-MAX_MAP_LATITUDE, Math.min(MAX_MAP_LATITUDE, latitude));
    const safeLongitude = Math.max(-180, Math.min(180, longitude));
    setPin(safeLatitude, safeLongitude);
    onSelect(safeLatitude, safeLongitude);
  }

  map.on("click", ({ latlng }) => chooseLocation(latlng.lat, latlng.lng));
  marker.on("dragend", () => {
    const { lat, lng } = marker.getLatLng();
    chooseLocation(lat, lng);
  });

  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query.length < 2) {
      message.textContent = "Enter at least two characters for a city.";
      resultsList.hidden = true;
      return;
    }

    searchButton.disabled = true;
    message.textContent = "Searching cities…";
    resultsList.hidden = true;
    resultsList.replaceChildren();

    try {
      const key = query.toLocaleLowerCase();
      let places = searchCache.get(key);
      if (!places) {
        places = await searchCities(query);
        searchCache.set(key, places);
      }
      if (places.length === 0) {
        message.textContent = "No matching cities found. Try adding a country or region.";
        return;
      }

      for (const place of places) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = placeLabel(place);
        button.addEventListener("click", () => {
          setPin(place.latitude, place.longitude, 11);
          onSelect(place.latitude, place.longitude);
          message.textContent = Math.abs(place.latitude) > MAX_MAP_LATITUDE
            ? `Selected ${placeLabel(place)}. This location is outside the map's Web Mercator area.`
            : `Selected ${placeLabel(place)}.`;
          resultsList.hidden = true;
        });
        item.append(button);
        resultsList.append(item);
      }
      resultsList.hidden = false;
      message.textContent = `${places.length} matching ${places.length === 1 ? "place" : "places"}. Choose one below.`;
    } catch (error) {
      message.textContent = error.message || "City search is unavailable right now.";
    } finally {
      searchButton.disabled = false;
    }
  });

  return { setPin };
}
