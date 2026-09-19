// Native platform file: Metro resolves this for iOS/Android bundles. Imports
// react-native-maps; the web twin (showMap.tsx) never pulls it into web.
export { NativeOsmMap as ShowMap } from './NativeOsmMap';