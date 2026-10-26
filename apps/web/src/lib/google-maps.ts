import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

/** Loads Google Maps once for the whole page, however many maps ask for it. */
export async function loadGoogleMaps(apiKey: string) {
  if (!configured) {
    setOptions({ key: apiKey, v: "weekly", language: "en", region: "IN" });
    configured = true;
  }
  const maps = await importLibrary("maps");
  await importLibrary("marker");
  return maps;
}
