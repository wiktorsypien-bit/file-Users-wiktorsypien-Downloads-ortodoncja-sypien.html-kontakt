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

## Oczekiwane nazwy plików

| # | Pozycja na stronie                                    | Nazwa pliku                  | Status |
|---|-------------------------------------------------------|------------------------------|--------|
| 1 | Mentor — Kois Center, Seattle                         | `kois-center.jpg`            | brak   |
| 2 | Certyfikowany wykładowca — Curriculum Bicon, Boston   | `bicon-curriculum.jpg`       | brak   |
| 3 | Zaawansowana chirurgia — Steigmann Institute          | `steigmann-institute.jpg`    | brak   |
| 4 | Masterclass tkanek miękkich — Hürzeler/Zuhr           | `hurzeler-zuhr.jpg`          | brak   |
| 5 | Europejski Tytuł Implantologa — Goethe University     | `goethe-university-ects.jpg` | brak   |
| 6 | Airway Mini-Residency — New Jersey                    | `airway-mini-residency.jpg`  | brak   |

Nazwa musi się zgadzać co do znaku, łącznie z rozszerzeniem `.jpg`.
Jeśli wolisz inne rozszerzenie, zmień je też w atrybucie `data-cert`
w `index.html` **i** w `en/index.html`.

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
