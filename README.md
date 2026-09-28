# Coordinate Converter

A small, dependency free JavaScript web app for converting WGS 84 latitude and longitude into EPSG:3857 Web Mercator metres and between decimal degrees (DD), degrees and decimal minutes (DDM), and degrees, minutes, and seconds (DMS).

Serve this directory with any static web server, then open it in a modern browser. For example, run `python3 -m http.server 8000` and visit `http://localhost:8000`. Enter latitude and longitude separately; the results update as you type. Compass directions can be placed before or after a coordinate. A minus sign means south for latitude and west for longitude.

Examples:

- Decimal degrees: `40.446111`, `-79.982222`
- Decimal minutes: `40° 26.7667′ N`, `79° 58.9333′ W`
- DMS: `40° 26′ 46″ N`, `79° 58′ 56″ W`

The degree inputs and outputs are WGS 84 geographic coordinates (EPSG:4326). Only the **Web Mercator** result is EPSG:3857. It shows X (easting), then Y (northing), in metres. The app does not infer or transform other source datums. EPSG:3857 is available between 85.06°S and 85.06°N; outside that area, degree conversions remain available but the projected result is withheld.

Run the converter tests with `npm test` (Node.js 18 or later). No install step is needed.

## Publish on GitHub Pages

The included GitHub Actions workflow tests and publishes the four site files on every push to `main`.

1. Create a GitHub repository and push this project's `main` branch to it.
2. In the repository, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open the **Actions** tab and wait for **Deploy to GitHub Pages** to finish. The site URL appears in the deployment and in **Settings → Pages**.

The page uses relative asset paths, so it works at a project URL such as `https://USERNAME.github.io/gis-converter/` as well as at a custom domain.
