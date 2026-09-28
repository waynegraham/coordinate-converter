const DIRECTIONS = {
  latitude: { positive: "N", negative: "S", limit: 90 },
  longitude: { positive: "E", negative: "W", limit: 180 },
};

/**
 * Read one latitude or longitude in decimal degrees, decimal minutes, or DMS.
 * Examples: -79.982222, 79° 58.9333′ W, 79° 58′ 56″ W.
 */
export function parseCoordinate(input, axis) {
  const settings = DIRECTIONS[axis];
  if (!settings) throw new Error("Axis must be latitude or longitude.");

  const value = String(input ?? "").trim().toUpperCase().replace(/−/g, "-");
  if (!value) throw new Error(`Enter a ${axis}.`);

  const match = value.match(/^([NSEW])?\s*(.*?)\s*([NSEW])?$/);
  if (!match) throw new Error("Use a number with an optional compass direction.");

  const direction = match[1] || match[3];
  if (match[1] && match[3]) {
    throw new Error("Use one compass direction per coordinate.");
  }
  if (direction && ![settings.positive, settings.negative].includes(direction)) {
    throw new Error(`Use ${settings.positive} or ${settings.negative} for ${axis}.`);
  }

  const body = match[2].trim();
  if (!/^[\d+\-.\s°º′’'″":]+$/.test(body)) {
    throw new Error("Use degrees, minutes, seconds, and an optional direction.");
  }

  const parts = body.replace(/[°º′’'″":]/g, " ").trim().split(/\s+/);
  if (parts.length < 1 || parts.length > 3 ||
      parts.some((part) => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(part))) {
    throw new Error("Enter decimal degrees, degrees and minutes, or degrees, minutes and seconds.");
  }

  if (parts.length > 1 && !/^\d+$/.test(parts[0].replace(/^[+-]/, ""))) {
    throw new Error("Use a whole number for degrees when adding minutes.");
  }
  if (parts.slice(1).some((part) => /^[+-]/.test(part))) {
    throw new Error("Minutes and seconds cannot have a sign.");
  }
  if (parts.length === 3 && !/^\d+$/.test(parts[1])) {
    throw new Error("Use whole minutes when adding seconds.");
  }

  const numbers = parts.map(Number);
  const [degrees, minutes = 0, seconds = 0] = numbers;
  if (!numbers.every(Number.isFinite)) throw new Error("Enter a finite coordinate.");
  if (minutes >= 60 || seconds >= 60) {
    throw new Error("Minutes and seconds must be less than 60.");
  }

  const explicitSign = parts[0].startsWith("-") ? -1 : parts[0].startsWith("+") ? 1 : 0;
  const directionSign = direction === settings.negative ? -1 : direction ? 1 : 0;
  if (explicitSign && directionSign && explicitSign !== directionSign) {
    throw new Error("The sign and compass direction disagree.");
  }

  const magnitude = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  if (magnitude > settings.limit + 1e-12) {
    throw new Error(`${axis === "latitude" ? "Latitude" : "Longitude"} must be within ±${settings.limit}°.`);
  }
  const sign = directionSign || explicitSign || 1;
  return sign * Math.min(magnitude, settings.limit);
}

function formatNumber(value, places) {
  return value.toFixed(places).replace(/\.?0+$/, "");
}

function partsFor(value, places, unit) {
  const total = Math.round(Math.abs(value) * unit * 10 ** places) / 10 ** places;
  const degrees = Math.floor(total / unit);
  const remainder = total - degrees * unit;
  return { degrees, remainder };
}

export function formatCoordinate(value, axis, format) {
  const settings = DIRECTIONS[axis];
  if (!settings || !Number.isFinite(value) || Math.abs(value) > settings.limit) {
    throw new Error("Invalid coordinate.");
  }
  const direction = value < 0 || Object.is(value, -0) ? settings.negative : settings.positive;

  if (format === "dd") return `${formatNumber(Math.abs(value), 8)}° ${direction}`;

  if (format === "ddm") {
    const { degrees, remainder } = partsFor(value, 5, 60);
    return `${degrees}° ${formatNumber(remainder, 5)}′ ${direction}`;
  }

  if (format === "dms") {
    const { degrees, remainder } = partsFor(value, 2, 3600);
    const minutes = Math.floor(remainder / 60);
    const seconds = remainder - minutes * 60;
    return `${degrees}° ${minutes}′ ${formatNumber(seconds, 2)}″ ${direction}`;
  }

  throw new Error("Unknown coordinate format.");
}

export function formatPair(latitude, longitude, format) {
  if (format === "signed") {
    return `${latitude.toFixed(8)}, ${longitude.toFixed(8)}`;
  }
  return `${formatCoordinate(latitude, "latitude", format)}, ${formatCoordinate(longitude, "longitude", format)}`;
}
