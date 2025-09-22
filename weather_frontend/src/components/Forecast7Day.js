import React from "react";

/**
 * 7-day forecast grid; accepts OneCall-like daily array or fallback aggregated days.
 */

// PUBLIC_INTERFACE
export default function Forecast7Day({ daily }) {
  /** Renders a grid of up to 7 days. */
  if (!Array.isArray(daily) || daily.length === 0) return null;

  const days = daily.slice(0, 7);
  const toWeekday = (dt) =>
    new Date((dt?.dt ? dt.dt : dt) * 1000).toLocaleDateString(undefined, {
      weekday: "short",
    });

  return (
    <section className="wf-card wf-forecast">
      <h3>7-Day Forecast</h3>
      <div className="wf-forecast-grid">
        {days.map((d, idx) => {
          const min = Math.round(d.temp?.min ?? d.min ?? d.temp?.day ?? 0);
          const max = Math.round(d.temp?.max ?? d.max ?? d.temp?.day ?? 0);
          const icon = d.weather?.[0]?.icon || "01d";
          const iconUrl = `https://openweathermap.org/img/wn/${icon}.png`;
          return (
            <div className="wf-forecast-day" key={idx}>
              <div className="wf-forecast-name">{toWeekday(d)}</div>
              <img className="wf-forecast-icon" src={iconUrl} alt="icon" />
              <div className="wf-forecast-temps">
                <span className="wf-forecast-max">{max}°</span>
                <span className="wf-forecast-min">{min}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
