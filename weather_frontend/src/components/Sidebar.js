import React from "react";

/**
 * Sidebar with location metadata and simple controls (units).
 */

// PUBLIC_INTERFACE
export default function Sidebar({ place, coords, units, onUnitsChange }) {
  /** Show reverse geocode label and controls. */
  return (
    <aside className="wf-sidebar">
      <div className="wf-card wf-sidecard">
        <h3>Location</h3>
        <div className="wf-loc-block">
          <div className="wf-loc-title">{place || "—"}</div>
          {coords && (
            <div className="wf-loc-coords">
              <span>Lat: {coords.lat.toFixed(3)}</span>
              <span>Lon: {coords.lon.toFixed(3)}</span>
            </div>
          )}
        </div>

        <h4 className="wf-side-subtitle">Units</h4>
        <div className="wf-units">
          <button
            className={`wf-chip ${units === "metric" ? "active" : ""}`}
            onClick={() => onUnitsChange("metric")}
          >
            Metric (°C)
          </button>
          <button
            className={`wf-chip ${units === "imperial" ? "active" : ""}`}
            onClick={() => onUnitsChange("imperial")}
          >
            Imperial (°F)
          </button>
        </div>

        <p className="wf-smallnote">
          Tip: Allow location access for instant local weather.
        </p>
      </div>
    </aside>
  );
}
