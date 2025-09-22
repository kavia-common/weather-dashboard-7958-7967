//
// Weather API service utilities for OpenWeatherMap (free tier)
// Handles geocoding, current weather, and 7-day forecast via One Call API.
//
// Notes:
// - Requires REACT_APP_OPENWEATHER_API_KEY set in environment (do not hardcode)
// - Uses metric units by default; can be extended for imperial.
// - Free tier supports One Call 3.0 (limited), alternatively chain current + forecast endpoints.
//

const API_BASE = "https://api.openweathermap.org";
const GEO_PATH = "/geo/1.0/direct";
const REVERSE_GEO_PATH = "/geo/1.0/reverse";
const WEATHER_PATH = "/data/2.5/weather";
const ONECALL_PATH = "/data/3.0/onecall"; // Prefer 3.0 if available on the environment
const FORECAST_DAILY_FALLBACK = "/data/2.5/forecast"; // 3-hourly, used to derive daily if One Call is unavailable

const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

/**
 * INTERNAL: Build URL with params
 */
function buildUrl(path, params = {}) {
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

/**
 * INTERNAL: Fetch JSON with basic error handling
 */
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function geocodeCity(query, limit = 5) {
  /** Geocode a city name to coordinates using OWM Direct Geocoding API. */
  if (!API_KEY) {
    throw new Error("Missing REACT_APP_OPENWEATHER_API_KEY environment variable.");
  }
  const url = buildUrl(GEO_PATH, { q: query, limit, appid: API_KEY });
  return getJson(url);
}

// PUBLIC_INTERFACE
export async function reverseGeocode(lat, lon, limit = 1) {
  /** Reverse geocode coordinates to a place name. */
  if (!API_KEY) {
    throw new Error("Missing REACT_APP_OPENWEATHER_API_KEY environment variable.");
  }
  const url = buildUrl(REVERSE_GEO_PATH, { lat, lon, limit, appid: API_KEY });
  return getJson(url);
}

// PUBLIC_INTERFACE
export async function getCurrentWeatherByCoords(lat, lon, units = "metric") {
  /** Get current weather by coordinates. */
  if (!API_KEY) {
    throw new Error("Missing REACT_APP_OPENWEATHER_API_KEY environment variable.");
  }
  const url = buildUrl(WEATHER_PATH, { lat, lon, units, appid: API_KEY });
  return getJson(url);
}

// PUBLIC_INTERFACE
export async function getCurrentWeatherByCity(city, units = "metric") {
  /** Get current weather by city name (uses weather endpoint). */
  if (!API_KEY) {
    throw new Error("Missing REACT_APP_OPENWEATHER_API_KEY environment variable.");
  }
  const url = buildUrl(WEATHER_PATH, { q: city, units, appid: API_KEY });
  return getJson(url);
}

/**
 * Try One Call (3.0) first for daily; fall back to 3-hour forecast (2.5) aggregated to daily.
 */
async function getDailyForecastFallback(lat, lon, units = "metric") {
  const url = buildUrl(FORECAST_DAILY_FALLBACK, { lat, lon, units, appid: API_KEY });
  const data = await getJson(url);
  // Aggregate 3-hourly list into day buckets (using simple min/max/avg)
  const byDay = {};
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const key = date.toISOString().slice(0, 10);
    if (!byDay[key]) {
      byDay[key] = {
        temps: [],
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        iconVotes: {},
        dt: item.dt,
      };
    }
    const t = item.main.temp;
    byDay[key].temps.push(t);
    byDay[key].min = Math.min(byDay[key].min, item.main.temp_min);
    byDay[key].max = Math.max(byDay[key].max, item.main.temp_max);
    const icon = item.weather?.[0]?.icon;
    if (icon) byDay[key].iconVotes[icon] = (byDay[key].iconVotes[icon] || 0) + 1;
  });

  const days = Object.entries(byDay)
    .slice(0, 7)
    .map(([date, v]) => {
      const avg = v.temps.length ? v.temps.reduce((a, b) => a + b, 0) / v.temps.length : null;
      const icon =
        Object.entries(v.iconVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || "01d";
      return {
        dt: v.dt,
        date,
        temp: { min: v.min, max: v.max, day: avg },
        weather: [{ icon }],
      };
    });

  return { daily: days };
}

// PUBLIC_INTERFACE
export async function getSevenDayForecast(lat, lon, units = "metric") {
  /**
   * Get a 7-day forecast by coordinates.
   * Attempts One Call API 3.0; if unavailable, falls back to 3-hour forecast aggregation.
   */
  if (!API_KEY) {
    throw new Error("Missing REACT_APP_OPENWEATHER_API_KEY environment variable.");
  }

  // Try One Call 3.0
  try {
    const url = buildUrl(ONECALL_PATH, {
      lat,
      lon,
      exclude: "minutely,hourly,alerts",
      units,
      appid: API_KEY,
    });
    const data = await getJson(url);
    if (data?.daily?.length) {
      return { daily: data.daily.slice(0, 7) };
    }
    // fallthrough to fallback
  } catch (e) {
    // One Call might be unavailable on some free keys; fallback below
    // console.warn("One Call failed, using fallback:", e);
  }

  // Fallback to 3-hour forecast aggregation
  return getDailyForecastFallback(lat, lon, units);
}
