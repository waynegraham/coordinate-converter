import test from "node:test";
import assert from "node:assert/strict";
import { parseCoordinate, formatCoordinate, formatPair } from "./converter.js";

test("parses decimal degrees, decimal minutes, and DMS", () => {
  assert.equal(parseCoordinate("40.446111", "latitude"), 40.446111);
  assert.ok(Math.abs(parseCoordinate("40° 26.7667′ N", "latitude") - 40.4461116667) < 1e-9);
  assert.ok(Math.abs(parseCoordinate("79° 58′ 56″ W", "longitude") + 79.9822222222) < 1e-9);
  assert.equal(parseCoordinate("S 0:30:00", "latitude"), -0.5);
  assert.equal(parseCoordinate("−79.5", "longitude"), -79.5);
});

test("rejects out of range or contradictory coordinates", () => {
  assert.throws(() => parseCoordinate("91", "latitude"), /within/);
  assert.throws(() => parseCoordinate("180° 1′ E", "longitude"), /within/);
  assert.throws(() => parseCoordinate("40° 60′ N", "latitude"), /less than 60/);
  assert.throws(() => parseCoordinate("-40 N", "latitude"), /disagree/);
  assert.throws(() => parseCoordinate("40 E", "latitude"), /N or S/);
  assert.throws(() => parseCoordinate("40° -2′", "latitude"), /cannot have a sign/);
});

test("formats known values and rounds across a minute boundary", () => {
  assert.equal(formatCoordinate(-79.9822222222, "longitude", "dms"), "79° 58′ 56″ W");
  assert.equal(formatCoordinate(40.4461111111, "latitude", "ddm"), "40° 26.76667′ N");
  assert.equal(formatCoordinate(12 + 59.999999 / 60, "latitude", "ddm"), "13° 0′ N");
  assert.equal(formatPair(40.5, -79.5, "signed"), "40.50000000, -79.50000000");
});
