import {
  geocodeCity,
  reverseGeocode,
  getCurrentWeatherByCoords,
  getCurrentWeatherByCity,
  getSevenDayForecast,
} from "../weatherApi";

// Helper to mock fetch
const mockFetch = (status, body) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? "Not Found" : "OK",
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  });
};

describe("weatherApi service", () => {
  const API_BASE = "https://api.openweathermap.org";
  const GEO_PATH = "/geo/1.0/direct";
  const REVERSE_GEO_PATH = "/geo/1.0/reverse";
  const WEATHER_PATH = "/data/2.5/weather";
  const ONECALL_PATH = "/data/3.0/onecall";
  const FORECAST_FALLBACK = "/data/2.5/forecast";

  beforeAll(() => {
    // Ensure env key is set for the module
    process.env.REACT_APP_OPENWEATHER_API_KEY = "test_key";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("geocodeCity calls correct endpoint with params and handles valid response", async () => {
    const sample = [{ name: "Paris", country: "FR", lat: 48.8566, lon: 2.3522 }];
    mockFetch(200, sample);

    const result = await geocodeCity("Paris", 3);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = new URL(global.fetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(API_BASE + GEO_PATH);
    expect(url.searchParams.get("q")).toBe("Paris");
    expect(url.searchParams.get("limit")).toBe("3");
    expect(url.searchParams.get("appid")).toBe("test_key");
    expect(result).toEqual(sample);
  });

  test("reverseGeocode calls correct endpoint with params and handles valid response", async () => {
    const sample = [{ name: "Paris", state: "Ile-de-France", country: "FR" }];
    mockFetch(200, sample);

    const result = await reverseGeocode(48.8566, 2.3522, 1);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = new URL(global.fetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(API_BASE + REVERSE_GEO_PATH);
    expect(url.searchParams.get("lat")).toBe("48.8566");
    expect(url.searchParams.get("lon")).toBe("2.3522");
    expect(url.searchParams.get("limit")).toBe("1");
    expect(url.searchParams.get("appid")).toBe("test_key");
    expect(result).toEqual(sample);
  });

  test("getCurrentWeatherByCoords calls correct endpoint with params and returns payload", async () => {
    const payload = {
      name: "Paris",
      main: { temp: 20, feels_like: 19 },
      wind: { speed: 2.5 },
      weather: [{ description: "clear sky", icon: "01d" }],
    };
    mockFetch(200, payload);

    const res = await getCurrentWeatherByCoords(48.8566, 2.3522, "metric");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = new URL(global.fetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(API_BASE + WEATHER_PATH);
    expect(url.searchParams.get("lat")).toBe("48.8566");
    expect(url.searchParams.get("lon")).toBe("2.3522");
    expect(url.searchParams.get("units")).toBe("metric");
    expect(url.searchParams.get("appid")).toBe("test_key");
    expect(res).toEqual(payload);
  });

  test("getCurrentWeatherByCity calls correct endpoint with params and returns payload", async () => {
    const payload = {
      name: "Tokyo",
      sys: { country: "JP" },
      coord: { lat: 35.6895, lon: 139.6917 },
      main: { temp: 27 },
      weather: [{ description: "clouds", icon: "02d" }],
    };
    mockFetch(200, payload);

    const res = await getCurrentWeatherByCity("Tokyo", "imperial");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = new URL(global.fetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(API_BASE + WEATHER_PATH);
    expect(url.searchParams.get("q")).toBe("Tokyo");
    expect(url.searchParams.get("units")).toBe("imperial");
    expect(url.searchParams.get("appid")).toBe("test_key");
    expect(res).toEqual(payload);
  });

  test("handles error/invalid response (404 city not found) for getCurrentWeatherByCity", async () => {
    // Simulate a 404 from server with text reason
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: jest.fn(),
      text: jest.fn().mockResolvedValue("city not found"),
    });

    await expect(getCurrentWeatherByCity("InvalidCity", "metric")).rejects.toThrow(
      /Request failed 404: city not found/i
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("handles network error for getCurrentWeatherByCoords", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    await expect(getCurrentWeatherByCoords(10, 20, "metric")).rejects.toThrow(/Network error/);
  });

  test("getSevenDayForecast uses One Call 3.0 when available and returns first 7 days", async () => {
    const daily = Array.from({ length: 8 }).map((_, i) => ({
      dt: 1700000000 + i * 86400,
      temp: { min: 10 + i, max: 15 + i },
      weather: [{ icon: "01d" }],
    }));
    // First call for onecall
    mockFetch(200, { daily });
    const res = await getSevenDayForecast(40, -70, "metric");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = new URL(global.fetch.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(API_BASE + ONECALL_PATH);
    expect(url.searchParams.get("lat")).toBe("40");
    expect(url.searchParams.get("lon")).toBe("-70");
    expect(url.searchParams.get("units")).toBe("metric");
    expect(url.searchParams.get("exclude")).toContain("minutely");
    expect(url.searchParams.get("appid")).toBe("test_key");
    expect(res.daily).toHaveLength(7);
    expect(res.daily[0]).toEqual(daily[0]);
  });

  test("getSevenDayForecast falls back to 3-hour forecast aggregation when One Call fails", async () => {
    // Make first call (One Call) fail
    global.fetch = jest
      .fn()
      // One Call 3.0 call fails (throw in getJson or not ok)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: jest.fn(),
        text: jest.fn().mockResolvedValue("unauthorized"),
      })
      // Fallback forecast 2.5 returns list of 3-hour entries
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: jest.fn().mockResolvedValue({
          list: [
            {
              dt: 1700000000,
              main: { temp: 10, temp_min: 9, temp_max: 12 },
              weather: [{ icon: "02d" }],
            },
            {
              dt: 1700010800, // same day 3h later
              main: { temp: 11, temp_min: 10, temp_max: 13 },
              weather: [{ icon: "02d" }],
            },
            {
              dt: 1700080000, // next day
              main: { temp: 14, temp_min: 13, temp_max: 16 },
              weather: [{ icon: "03d" }],
            },
          ],
        }),
        text: jest.fn().mockResolvedValue(""),
      });

    const res = await getSevenDayForecast(51.5, -0.1, "metric");

    // Should have made two requests: onecall then fallback forecast
    expect(global.fetch).toHaveBeenCalledTimes(2);

    const firstUrl = new URL(global.fetch.mock.calls[0][0]);
    expect(firstUrl.origin + firstUrl.pathname).toBe(API_BASE + ONECALL_PATH);

    const secondUrl = new URL(global.fetch.mock.calls[1][0]);
    expect(secondUrl.origin + secondUrl.pathname).toBe(API_BASE + FORECAST_FALLBACK);

    expect(res).toHaveProperty("daily");
    expect(Array.isArray(res.daily)).toBe(true);
    // Expect at most 7 days, here should be 2 aggregated days
    expect(res.daily.length).toBeGreaterThanOrEqual(2);
    // Validate structure of aggregated result
    const day1 = res.daily[0];
    expect(day1).toHaveProperty("temp");
    expect(day1.temp).toHaveProperty("min");
    expect(day1.temp).toHaveProperty("max");
    expect(day1).toHaveProperty("weather");
  });

  test("throws helpful error if API key missing", async () => {
    // Temporarily unset API key and reload module functions dynamically
    const original = process.env.REACT_APP_OPENWEATHER_API_KEY;
    process.env.REACT_APP_OPENWEATHER_API_KEY = "";

    // Dynamic import a fresh copy to ensure new env is read would be complex in CRA env.
    // Instead, we directly call and expect thrown from functions that check key at call time.
    await expect(geocodeCity("Paris")).rejects.toThrow(/Missing REACT_APP_OPENWEATHER_API_KEY/);
    await expect(reverseGeocode(1, 2)).rejects.toThrow(/Missing REACT_APP_OPENWEATHER_API_KEY/);
    await expect(getCurrentWeatherByCoords(1, 2)).rejects.toThrow(/Missing REACT_APP_OPENWEATHER_API_KEY/);
    await expect(getCurrentWeatherByCity("NYC")).rejects.toThrow(/Missing REACT_APP_OPENWEATHER_API_KEY/);
    await expect(getSevenDayForecast(1, 2)).rejects.toThrow(/Missing REACT_APP_OPENWEATHER_API_KEY/);

    // Restore
    process.env.REACT_APP_OPENWEATHER_API_KEY = original || "test_key";
  });
});
