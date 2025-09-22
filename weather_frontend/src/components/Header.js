import React, { useState } from "react";

/**
 * Header with search bar following Ocean Professional style.
 * Blue primary background with amber accents.
 */

// PUBLIC_INTERFACE
export default function Header({ onSearch, isLoading }) {
  /** Renders the top header with a search bar. onSearch(query) will be called when user submits. */
  const [query, setQuery] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <header className="wf-header">
      <div className="wf-header-inner">
        <div className="wf-brand">
          <span className="wf-logo" aria-hidden>
            🌊
          </span>
          <div className="wf-title">
            <h1>Ocean Weather</h1>
            <p className="wf-subtitle">Clean. Modern. Accurate.</p>
          </div>
        </div>
        <form className="wf-search" onSubmit={submit} role="search" aria-label="Search city weather">
          <input
            type="text"
            placeholder="Search city (e.g., Paris, Tokyo)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="City"
          />
          <button type="submit" disabled={isLoading} aria-label="Search">
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>
    </header>
  );
}
