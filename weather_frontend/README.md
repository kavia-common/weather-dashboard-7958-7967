# Ocean Weather Dashboard (React)

A modern, responsive weather dashboard that:
- Uses free OpenWeatherMap APIs (current weather + 7-day forecast)
- Auto-detects user location (via browser geolocation)
- Allows search by city
- Styled with the "Ocean Professional" theme (blue & amber accents)

No authentication is used anywhere in the app.

## Quick Start

1) Install dependencies
   npm install

2) Configure environment
   - Copy .env.example to .env and set your OpenWeatherMap API key
     REACT_APP_OPENWEATHER_API_KEY=your_key

   Get a free key here: https://openweathermap.org/api

3) Run
   npm start

Open http://localhost:3000 to view.

## Notes

- If geolocation is denied/unavailable, use the search bar to find a city.
- Units can be toggled in the sidebar between Metric (°C) and Imperial (°F).
- The app attempts One Call v3.0 for daily forecasts and falls back to an aggregated 3-hour forecast when necessary.

## Tech

- React 18
- No UI frameworks (custom CSS)
- Client-side fetch to OpenWeatherMap

