// Shared Mapbox basemap config for the gate globe + live map.

export type ThemeName = "light" | "dark";

export const MAP_STYLE: Record<ThemeName, string> = {
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/light-v11",
};

// App background per theme — also used as the globe's "space" color.
export const MAP_BG: Record<ThemeName, string> = {
  dark: "#09090b",
  light: "#fafafa",
};
