import React from "react";

/**
 * Displays the current weather in a prominent card.
 */

// PUBLIC_INTERFACE
export default function CurrentWeatherCard({ data, locationLabel }) {
  /**
   * Render a main card presenting current weather.
   * data should be OpenWeatherMap "weather" endpoint response.
   */
  if (!data) return null;

  const temp = Math.round(data.main?.temp);
  const feels = Math.round(data.main?.feels_like);
  const humidity = data.main?.humidity;
  const wind = data.wind?.speed;
  const desc = data.weather?.[0]?.description;
  const icon = data.weather?.[0]?.icon;
  const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : null;

  return (
    <section className="wf-card wf-current">
      <div className="wf-current-top">
        <div className="wf-current-location">
          <h2>{locationLabel || data.name}</h2>
          <span className="wf-current-desc">{desc ? desc[0].toUpperCase() + desc.slice(1) : ""}</span>
        </div>
        <div className="wf-current-temp">
          {iconUrl && <img src={iconUrl} alt={desc || "Weather icon"} />}
          <div>
            <div className="wf-temp-value">{temp}°</div>
            <div className="wf-feels">Feels like {feels}°</div>
          </div>
        </div>
      </div>
      <div className="wf-current-stats">
        <div className="wf-stat">
          <span className="wf-stat-label">Humidity</span>
          <span className="wf-stat-value">{humidity}%</span>
        </div>
        <div className="wf-stat">
          <span className="wf-stat-label">Wind</span>
          <span className="wf-stat-value">{wind} m/s</span>
        </div>
        <div className="wf-stat">
          <span className="wf-stat-label">Pressure</span>
          <span className="wf-stat-value">{data.main?.pressure} hPa</span>
        </div>
      </div>
    </section>
  );
}
