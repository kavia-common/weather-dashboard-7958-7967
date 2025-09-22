import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./index.css";
import Header from "./components/Header";
import CurrentWeatherCard from "./components/CurrentWeatherCard";
import Forecast7Day from "./components/Forecast7Day";
import Sidebar from "./components/Sidebar";
import {
  geocodeCity,
  reverseGeocode,
  getCurrentWeatherByCoords,
  getCurrentWeatherByCity,
  getSevenDayForecast,
} from "./services/weatherApi";

/**
 * App: Weather dashboard without authentication.
 * - Requests geolocation for initial load (with graceful fallback).
 * - Allows city search.
 * - Displays current weather and 7-day forecast.
 * - Responsive, "Ocean Professional" theme with blue primary and amber accents.
 */

// PUBLIC_INTERFACE
function App() {
  /** Root component for the weather dashboard. */
  const [units, setUnits] = useState("metric"); // 'metric' or 'imperial'
  const [locationLabel, setLocationLabel] = useState("");
  const [coords, setCoords] = useState(null);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [error, setError] = useState("");

  // Default theme variables to Ocean Professional
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--ocean-primary", "#2563EB");
    root.style.setProperty("--ocean-amber", "#F59E0B");
    root.style.setProperty("--ocean-bg", "#f9fafb");
    root.style.setProperty("--ocean-surface", "#ffffff");
    root.style.setProperty("--ocean-text", "#111827");
    root.style.setProperty("--ocean-muted", "#6B7280");
    root.style.setProperty("--ocean-border", "rgba(0,0,0,0.08)");
    root.style.setProperty("--ocean-shadow", "0 10px 25px rgba(0,0,0,0.08)");
    root.style.setProperty("--ocean-grad", "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(249,250,251,1))");
  }, []);

  const unitSymbol = useMemo(() => (units === "metric" ? "°C" : "°F"), [units]);

  const fetchByCoords = async (lat, lon) => {
    setLoading(true);
    setError("");
    try {
      const [cur, daily, place] = await Promise.all([
        getCurrentWeatherByCoords(lat, lon, units),
        getSevenDayForecast(lat, lon, units),
        reverseGeocode(lat, lon, 1).catch(() => []),
      ]);
      setCoords({ lat, lon });
      setCurrent(cur);
      setForecast(daily.daily || []);
      const resolved = place?.[0];
      setLocationLabel(
        resolved
          ? [resolved.name, resolved.state, resolved.country].filter(Boolean).join(", ")
          : cur?.name || ""
      );
    } catch (e) {
      setError(e.message || "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  const fetchByCity = async (city) => {
    setLoading(true);
    setError("");
    try {
      // try direct current weather by city (name) for immediate response
      const cur = await getCurrentWeatherByCity(city, units);
      setCurrent(cur);
      const lat = cur?.coord?.lat;
      const lon = cur?.coord?.lon;
      setCoords({ lat, lon });

      // forecast and city label
      const daily = await getSevenDayForecast(lat, lon, units);
      setForecast(daily.daily || []);
      setLocationLabel([cur.name, cur.sys?.country].filter(Boolean).join(", "));
    } catch (e) {
      setError(e.message || "City not found");
    } finally {
      setLoading(false);
    }
  };

  // Geolocation on first mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchByCoords(latitude, longitude);
      },
      () => {
        setGeoDenied(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If units change, refresh data for current coords/city
  useEffect(() => {
    if (coords?.lat && coords?.lon) {
      fetchByCoords(coords.lat, coords.lon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  return (
    <div className="wf-app">
      <Header onSearch={fetchByCity} isLoading={loading} />

      <main className="wf-main">
        <div className="wf-layout">
          <div className="wf-left">
            {error && <div className="wf-error" role="alert">⚠️ {error}</div>}

            {!current && !loading && geoDenied && (
              <div className="wf-tip">
                We couldn&apos;t access your location. Try searching for a city above.
              </div>
            )}

            {loading && <div className="wf-loading">Loading weather...</div>}

            {!loading && current && (
              <>
                <CurrentWeatherCard data={current} locationLabel={locationLabel} />
                <Forecast7Day daily={forecast} />
              </>
            )}
          </div>

          <div className="wf-right">
            <Sidebar
              place={locationLabel}
              coords={coords}
              units={units}
              onUnitsChange={setUnits}
            />
          </div>
        </div>
      </main>

      <footer className="wf-footer">
        <div>
          <span>Data by OpenWeatherMap</span>
          <span className="dot">•</span>
          <span>{unitSymbol}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
