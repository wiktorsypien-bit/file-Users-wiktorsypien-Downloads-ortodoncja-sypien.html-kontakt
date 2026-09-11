import { useEffect, useRef, useState } from "react";
import Timeline from "./Timeline.jsx";

const VIBES = [
  { id: "romantic", label: "Romantycznie", emoji: "🌹" },
  { id: "adventure", label: "Przygoda", emoji: "🧗" },
  { id: "chill", label: "Na luzie", emoji: "🌙" },
  { id: "culture", label: "Kultura", emoji: "🎭" },
  { id: "food", label: "Jedzenie", emoji: "🍜" },
];

const BUDGETS = [
  { id: "low", label: "Niski" },
  { id: "mid", label: "Średni" },
  { id: "high", label: "Wysoki" },
];

const LOADING_MESSAGES = [
  "Przeszukuję mapę miasta…",
  "Sprawdzam, co jest dziś otwarte…",
  "Czytam opinie i menu…",
  "Porównuję ceny…",
  "Układam trasę wieczoru…",
  "Dopinam ostatnie szczegóły…",
];

const REQUEST_TIMEOUT_MS = 240_000; // web search + ewentualne kontynuacje

function Loading({ city }) {
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const msg = setInterval(() => setIndex((i) => (i + 1) % LOADING_MESSAGES.length), 3500);
    const sec = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(msg);
      clearInterval(sec);
    };
  }, []);

  return (
    <div className="loading" role="status">
      <div className="loading-orb" aria-hidden="true" />
      <p className="loading-city">{city}</p>
      <p className="loading-message" key={index}>
        {LOADING_MESSAGES[index]}
      </p>
      <p className="loading-hint">
        AI przeszukuje prawdziwe miejsca w sieci — to zwykle trwa 20–40 sekund.
        {seconds > 0 && <span className="loading-seconds"> ({seconds}s)</span>}
      </p>
    </div>
  );
}

export default function App() {
  const [city, setCity] = useState("");
  const [vibe, setVibe] = useState("romantic");
  const [budget, setBudget] = useState("mid");
  const [adultsOnly, setAdultsOnly] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  async function requestPlan() {
    setStatus("loading");
    setError("");
    setPlan(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), vibe, budget, adultsOnly }),
        signal: controller.signal,
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        // non-JSON error body — handled below
      }

      if (!res.ok || !data?.plan) {
        throw new Error(data?.error || `Serwer odpowiedział błędem (${res.status}).`);
      }

      setPlan(data.plan);
      setStatus("done");
    } catch (err) {
      setError(
        err?.name === "AbortError"
          ? "Przekroczono limit czasu — wyszukiwanie trwało zbyt długo. Spróbuj ponownie."
          : err?.message || "Coś poszło nie tak.",
      );
      setStatus("error");
    } finally {
      clearTimeout(timeout);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!city.trim()) return;
    requestPlan();
  }

  function reset() {
    abortRef.current?.abort();
    setStatus("idle");
    setPlan(null);
    setError("");
  }

  return (
    <main className="shell">
      <header className="hero">
        <h1 className="hero-title">Plan na wieczór</h1>
        <p className="hero-tagline">Twoja randka, zaplanowana przez AI — prawdziwe miejsca, jeden wieczór.</p>
      </header>

      {status === "idle" && (
        <form className="form" onSubmit={onSubmit}>
          <label className="field-label" htmlFor="city">
            Miasto
          </label>
          <input
            id="city"
            className="city-input"
            type="text"
            placeholder="np. Katowice"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="off"
            maxLength={80}
            required
          />

          <p className="field-label">Klimat wieczoru</p>
          <div className="pills" role="radiogroup" aria-label="Klimat wieczoru">
            {VIBES.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={vibe === v.id}
                className={`pill ${vibe === v.id ? "pill-active" : ""}`}
                onClick={() => setVibe(v.id)}
              >
                <span aria-hidden="true">{v.emoji}</span> {v.label}
              </button>
            ))}
          </div>

          <p className="field-label">Budżet</p>
          <div className="pills" role="radiogroup" aria-label="Budżet">
            {BUDGETS.map((b) => (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={budget === b.id}
                className={`pill ${budget === b.id ? "pill-active" : ""}`}
                onClick={() => setBudget(b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={adultsOnly}
              onChange={(e) => setAdultsOnly(e.target.checked)}
            />
            <span className="toggle-track" aria-hidden="true" />
            <span className="toggle-label">
              18+ <small>(uwzględnij bary i puby)</small>
            </span>
          </label>

          <button className="submit" type="submit" disabled={!city.trim()}>
            Zaplanuj wieczór
          </button>
        </form>
      )}

      {status === "loading" && <Loading city={city.trim()} />}

      {status === "error" && (
        <div className="error-box" role="alert">
          <h2>Coś poszło nie tak</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button className="submit" type="button" onClick={requestPlan}>
              Spróbuj ponownie
            </button>
            <button className="ghost" type="button" onClick={reset}>
              Zmień parametry
            </button>
          </div>
        </div>
      )}

      {status === "done" && plan && (
        <>
          <Timeline plan={plan} />
          <button className="ghost again" type="button" onClick={reset}>
            ↺ Zaplanuj inny wieczór
          </button>
        </>
      )}

      <footer className="footer">
        Ceny i godziny otwarcia są orientacyjne — sprawdź je przed wyjściem.
      </footer>
    </main>
  );
}
