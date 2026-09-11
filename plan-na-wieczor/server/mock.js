// Mock plans for local development without an API key (run with MOCK=1).
// Shapes match the real schema exactly, so the whole frontend pipeline
// (parsing, timeline rendering, costs) can be exercised offline.

const KATOWICE = {
  city: "Katowice",
  currency: "PLN",
  title: "Industrialny wieczór w sercu Śląska",
  summary:
    "Spacer po Strefie Kultury, kolacja w klimacie śląskiej kamienicy i wieczór z muzyką na żywo.",
  stops: [
    {
      time: "17:30",
      name: "Muzeum Śląskie",
      area: "Strefa Kultury, ul. T. Dobrowolskiego 1",
      what: "Spacer po podziemnych galeriach dawnej kopalni i wjazd na wieżę widokową.",
      why: "Wspólne odkrywanie nietypowej przestrzeni to naturalny starter rozmowy.",
      cost: "60 PLN",
    },
    {
      time: "19:00",
      name: "Śląska Prohibicja",
      area: "ul. Mariacka 30",
      what: "Kolacja — nowoczesna kuchnia śląska, m.in. rolada z kluskami w wersji bistro.",
      why: "Kameralne wnętrze i dzielenie się regionalnymi daniami zbliżają.",
      cost: "180 PLN",
    },
    {
      time: "20:45",
      name: "Spacer po ulicy Mariackiej",
      area: "Mariacka / Stary Dworzec",
      what: "Wieczorny spacer deptakiem z przystankiem na lody rzemieślnicze.",
      why: "Chwila bez planu, żeby rozmowa płynęła swoim tempem.",
      cost: "30 PLN",
    },
    {
      time: "21:30",
      name: "Jazzclub Hipnoza",
      area: "pl. Sejmu Śląskiego 2",
      what: "Koncert jazzowy na żywo albo jam session w piwnicznym klubie.",
      why: "Muzyka na żywo robi nastrój, a wspólne odkrycie nowego brzmienia zostaje w pamięci.",
      cost: "80 PLN",
    },
  ],
  total_cost: "330-380 PLN",
};

const VANCOUVER = {
  city: "Vancouver",
  currency: "CAD",
  title: "Zachód słońca nad Pacyfikiem",
  summary:
    "Targ na Granville Island, zachód słońca w English Bay i ramen w Downtown — wieczór bez alkoholu (w Kolumbii Brytyjskiej legalny wiek to 19 lat).",
  stops: [
    {
      time: "17:00",
      name: "Granville Island Public Market",
      area: "Granville Island",
      what: "Przekąski z lokalnych straganów i spacer wzdłuż False Creek.",
      why: "Próbowanie nowych smaków we dwoje to najlepszy lodołamacz.",
      cost: "30 CAD",
    },
    {
      time: "18:30",
      name: "English Bay Beach",
      area: "West End",
      what: "Zachód słońca na plaży przy rzeźbie A-maze-ing Laughter.",
      why: "Trudno o bardziej romantyczne tło do rozmowy niż Pacyfik o zmierzchu.",
      cost: "0 CAD",
    },
    {
      time: "19:45",
      name: "Marutama Ramen",
      area: "Bidwell St, West End",
      what: "Kolacja — ramen na bulionie drobiowym, jeden z najlepszych w mieście.",
      why: "Ciepłe, kameralne miejsce idealne na dłuższą rozmowę przy jedzeniu.",
      cost: "55 CAD",
    },
    {
      time: "21:00",
      name: "Vancouver Lookout",
      area: "Harbour Centre, Downtown",
      what: "Panorama nocnego miasta z tarasu widokowego 168 m nad ulicą.",
      why: "Widok na światła miasta to mocne, filmowe zakończenie wieczoru.",
      cost: "40 CAD",
    },
  ],
  total_cost: "125-140 CAD",
};

export function mockPlan({ city }) {
  const normalized = (city || "").trim().toLowerCase();
  if (normalized.includes("vancouver")) return VANCOUVER;
  if (normalized.includes("katowice")) return KATOWICE;
  return { ...KATOWICE, city: city || "Katowice" };
}
