# Plan na wieczór 🌙

AI planer randek — wpisz miasto, wybierz klimat i budżet, a Claude (claude-sonnet-4-6 + web search) znajdzie prawdziwe, działające miejsca i ułoży wieczorną randkę jako oś czasu (4-5 przystanków z kosztami w lokalnej walucie).

## Uruchomienie

```bash
cd plan-na-wieczor
npm install
export ANTHROPIC_API_KEY=sk-ant-...   # Twój klucz API
npm run dev
```

Frontend: http://localhost:5173 (proxy /api → backend na :3001).

- **Tryb mock (bez klucza API):** `MOCK=1 npm run dev` — zwraca przykładowe plany (Katowice/Vancouver), pełny frontend działa offline.
- **Testy:** `npm test` (ekstrakcja JSON, pętla pause_turn, retry, render osi czasu).
- **Produkcja:** `npm run build && npm start` (serwer na :3001 serwuje zbudowany frontend).

## Architektura

- `server/` — Express; `POST /api/plan` proxuje do Anthropic API (klucz nigdy nie trafia do przeglądarki). Obsługa `pause_turn` (kontynuacja konwersacji przy długim web search), odporna ekstrakcja JSON + 1 automatyczny retry.
- `client/` — Vite + React; mobile-first, dark "cinematic noir" (śliwka + blush, Fraunces), rotujące komunikaty ładowania, timeout 240 s, ekran błędu z przyciskiem ponowienia.
- Tryb 18+ — prompt każe modelowi sprawdzić legalny wiek spożywania alkoholu w danym kraju i uwzględniać bary tylko, gdy wynosi on 18 lat.
