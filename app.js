import { formatPair, parseCoordinate } from "./converter.js";

const form = document.querySelector("#converter-form");
const latitudeInput = document.querySelector("#latitude");
const longitudeInput = document.querySelector("#longitude");
const results = document.querySelector("#results");
const emptyState = document.querySelector("#empty-state");
const status = document.querySelector("#status");
const sampleButton = document.querySelector("#sample-button");

function setError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  error.textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function convert() {
  let latitude;
  let longitude;
  let valid = true;

  for (const [input, axis] of [[latitudeInput, "latitude"], [longitudeInput, "longitude"]]) {
    try {
      const parsed = parseCoordinate(input.value, axis);
      if (axis === "latitude") latitude = parsed;
      else longitude = parsed;
      setError(input, "");
    } catch (error) {
      setError(input, error.message);
      valid = false;
    }
  }

  results.hidden = !valid;
  emptyState.hidden = valid;
  if (!valid) {
    status.textContent = "Check the highlighted coordinate fields.";
    return;
  }

  for (const output of results.querySelectorAll("[data-format]")) {
    const button = output.closest(".result-card").querySelector("[data-copy]");
    try {
      output.textContent = formatPair(latitude, longitude, output.dataset.format);
      button.disabled = false;
    } catch (error) {
      output.textContent = error.message;
      button.disabled = true;
    }
  }
  status.textContent = "Coordinates converted.";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  convert();
});

for (const input of [latitudeInput, longitudeInput]) {
  input.addEventListener("input", convert);
}

sampleButton.addEventListener("click", () => {
  latitudeInput.value = "40° 26′ 46″ N";
  longitudeInput.value = "79° 58′ 56″ W";
  convert();
});

results.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const value = button.closest(".result-card").querySelector("[data-format]").textContent;
  try {
    await navigator.clipboard.writeText(value);
    status.textContent = `${button.dataset.copy} copied to clipboard.`;
    const previous = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => { button.textContent = previous; }, 1600);
  } catch {
    status.textContent = "Clipboard access is unavailable. Select the result to copy it.";
  }
});

convert();
