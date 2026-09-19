// Native platform file: Metro resolves this for iOS/Android bundles. The
// WebView-based Leaflet map renders real OpenStreetMap tiles on devices;
// the web twin (showMap.tsx) uses the iframe map instead.
export { NativeOsmMap as ShowMap } from './NativeOsmMap';