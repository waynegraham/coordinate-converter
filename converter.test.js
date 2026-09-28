import test from "node:test";
import assert from "node:assert/strict";
import { parseCoordinate, formatCoordinate, formatPair, projectToWebMercator, unprojectFromWebMercator } from "./converter.js";

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

test("projects WGS 84 degrees to EPSG:3857 X/Y meters", () => {
  const origin = projectToWebMercator(0, 0);
  assert.deepEqual(origin, { x: 0, y: 0 });

  const paris = projectToWebMercator(49, 2);
  assert.ok(Math.abs(paris.x - 222638.9816) < 0.001);
  assert.ok(Math.abs(paris.y - 6274861.394) < 0.01);
  assert.equal(formatPair(49, 2, "epsg3857"), "222638.98, 6274861.39");

  const west = projectToWebMercator(-49, -2);
  assert.ok(Math.abs(west.x + paris.x) < 1e-8);
  assert.ok(Math.abs(west.y + paris.y) < 1e-8);
  assert.throws(() => projectToWebMercator(85.061, 0), /85.06/);
  assert.throws(() => projectToWebMercator(0, 181), /valid latitude/);
});

test("converts EPSG:3857 meters back to decimal degrees", () => {
  const { x, y } = projectToWebMercator(21.49012, 39.18624);
  const point = unprojectFromWebMercator(x, y);
  assert.ok(Math.abs(point.latitude - 21.49012) < 1e-10);
  assert.ok(Math.abs(point.longitude - 39.18624) < 1e-10);

  const example = unprojectFromWebMercator(222638.98, 6274861.39);
  assert.ok(Math.abs(example.latitude - 49) < 1e-6);
  assert.ok(Math.abs(example.longitude - 2) < 1e-6);
  const southwest = unprojectFromWebMercator(-x, -y);
  assert.ok(Math.abs(southwest.latitude + 21.49012) < 1e-10);
  assert.ok(Math.abs(southwest.longitude + 39.18624) < 1e-10);
  assert.throws(() => unprojectFromWebMercator(Infinity, 0), /finite/);
  assert.throws(() => unprojectFromWebMercator(20037509, 0), /outside/);
  assert.throws(() => unprojectFromWebMercator(0, 20048967), /outside/);
});
