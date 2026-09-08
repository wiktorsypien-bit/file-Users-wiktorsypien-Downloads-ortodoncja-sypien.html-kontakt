# certs/ — zdjęcia certyfikatów do sekcji „Uznanie międzynarodowe"

## Jak to działa

Każdy wiersz listy w sekcji „Uznanie" ma w HTML atrybut `data-cert`
z nazwą pliku, np.:

```html
<li data-cert="kois-center.jpg">
```

Skrypt na dole strony **sprawdza, czy ten plik naprawdę się wczytuje**:

- plik jest → wiersz zamienia się w przycisk, pojawia się znak `+`,
  kliknięcie rozwija zdjęcie certyfikatu;
- pliku nie ma → wiersz zostaje zwykłym tekstem, bez `+`, bez klikania.

Dlatego **nie trzeba nic zmieniać w kodzie** — wystarczy wrzucić plik
o właściwej nazwie do tego folderu i wiersz sam się uaktywni.
To ta sama zasada, na której działa portret w sekcji HERO.

## Stan plików

Kolumna „nr" to numer zdjęcia w galerii na sypien.pl
(`.../michalsypien-certyfikat-[NR].jpg`) — zapisany, żeby nie trzeba
było drugi raz przekopywać 158 zdjęć.

| # | Pozycja na stronie                                    | Nazwa pliku                  | Nr  | Stan |
|---|-------------------------------------------------------|------------------------------|-----|------|
| 1 | Mentor — Kois Center, Seattle                         | *(brak `data-cert`)*         | 141 | **celowo bez zdjęcia** — patrz niżej |
| 2 | Certyfikowany wykładowca — Curriculum Bicon, Boston   | *(brak `data-cert`)*         | 17  | **celowo bez zdjęcia** — patrz niżej |
| 3 | Zaawansowana chirurgia — Steigmann Institute          | `steigmann-institute.jpg`    | —   | w repo — ⚠ patrz uwaga o temacie |
| 4 | Masterclass tkanek miękkich — Hürzeler/Zuhr           | `hurzeler-zuhr.jpg`          | —   | w repo — ⚠ patrz uwaga o temacie |
| 5 | Europejski Tytuł Implantologa — Goethe University     | `goethe-university-ects.jpg` | —   | brak w całej galerii (sprawdzone OCR + ręcznie) |
| 6 | Airway Mini-Residency — New Jersey                    | `airway-mini-residency.jpg`  | —   | brak w całej galerii (sprawdzone OCR + ręcznie) |

Nazwa musi się zgadzać co do znaku, łącznie z rozszerzeniem `.jpg`.
Jeśli wolisz inne rozszerzenie, zmień je też w atrybucie `data-cert`
w `index.html` **i** w `en/index.html`.

## Dlaczego wiersze 1 i 2 nie mają `data-cert`

Opisy „Mentor — Kois Center" i „Certyfikowany wykładowca — Curriculum
Bicon, Boston" **zostają w oryginalnym brzmieniu**, ale świadomie nie
podpięto pod nie żadnego zdjęcia: w galerii na sypien.pl nie ma
dokumentu, który tych ról dowodzi.

Dostępne kandydatury zostały obejrzane i **odrzucone jako dowód**:

| Wiersz | Kandydat | Co jest na papierze | Dlaczego odrzucony |
|---|---|---|---|
| 1 Mentor — Kois Center | galeria nr **141** | „has successfully earned the membership level of **Graduate**", 5 XI 2016, podpis John C. Kois | *Graduate* to ukończenie kursu, nie rola mentorska |
| 2 Certyfikowany wykładowca — Curriculum Bicon, Boston | galeria nr **17** | „For the **attendance** at the course «Why Do We Need Short Implants?»", **Wiedeń**, 10–11 II 2017, 14 godzin, bicon + CMF Institut Wien | uczestnictwo w kursie ≠ status wykładowcy; Wiedeń ≠ Boston |

Ta tabela zostaje w repo jako zapis, **dlaczego** numery 141 i 17 nie
zostały użyte — żeby ktoś za pół roku nie „naprawił" tego, wgrywając je
z powrotem.

**Czego potrzeba, żeby te wiersze dało się rozwinąć:** dokumentu
mentorskiego z Kois Center i lektorskiego z BICON Center w Bostonie.
Biogram na stronie (linia 959) mówi, że Michał uczy jako certyfikowany
wykładowca BICON od 2015, więc taki papier prawdopodobnie istnieje —
po prostu nie ma go w galerii. Gdy się znajdzie, wystarczy wrzucić plik
do `certs/` i dopisać `data-cert` do wiersza.

## Pozostałe do rozstrzygnięcia

**Poz. 3 i 4 — tematy zamienione.** Instytucje pasują, ale wiersz o
chirurgii pokazuje papier o tkankach miękkich i odwrotnie:

| Wiersz na stronie | Treść certyfikatu |
|---|---|
| 3. Zaawansowana chirurgia — Steigmann | „Soft Tissue Management", Module 5, 2016 |
| 4. Masterclass tkanek miękkich — Hürzeler/Zuhr | „Advanced Surgical Procedures in Periodontology and Implant Therapy", 2017–2018 |

Do decyzji: zamienić opisy 3↔4, czy zostawić.

## Wymagania techniczne

- format: JPG
- waga: **maks. ~300 KB** na plik
- szerokość: 900–1200 px w zupełności wystarczy (na stronie panel ma 430 px)
- zdjęcie jest wyświetlane w ramce koloru `--brass-dim`, lekko odbarwione
  (`grayscale(.18) contrast(1.02)`) — tak samo jak portret w HERO

## Skąd wziąć pliki

Galeria certyfikatów jest na stronie kliniki:
<https://sypien.pl/o-centrum/nasz-personel/michal-sypien/>

Pliki lecą pod wzorcem:
`https://sypien.pl/wp-content/uploads/2024/09/michalsypien-certyfikat-[NUMER].jpg`

Nazwy plików **nie mówią nic o treści** — trzeba obejrzeć każdy certyfikat
i odczytać nazwę instytucji. Pomocniczy skrypt `fetch-certs.sh` w tym
folderze pobiera galerię lokalnie do przejrzenia i instaluje wybrane
zdjęcia pod właściwymi nazwami. Uruchom `./fetch-certs.sh` bez argumentów,
żeby zobaczyć instrukcję.

**Skrypt trzeba uruchomić lokalnie.** Sesje Claude Code na web mają
politykę egress, która blokuje `sypien.pl` (proxy odrzuca CONNECT
kodem 403), więc `pobierz` zwróci tam samo „brak" niezależnie od
numeru. Na własnym komputerze działa normalnie.
