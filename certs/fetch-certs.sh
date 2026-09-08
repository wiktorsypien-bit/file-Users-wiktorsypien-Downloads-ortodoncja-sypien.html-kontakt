#!/usr/bin/env bash
#
# Pomocnik do pobrania certyfikatow z galerii sypien.pl.
#
# Sesja Claude Code nie ma dostepu sieciowego do sypien.pl (polityka
# egress zwraca 403), wiec te dwa kroki trzeba uruchomic lokalnie.
#
#   ./fetch-certs.sh pobierz [OD] [DO]   -> sciaga galerie do ./_podglad/
#   ./fetch-certs.sh ustaw NUMER NAZWA   -> instaluje wybrane zdjecie
#
# Przyklad:
#   ./fetch-certs.sh pobierz 1 158
#   open _podglad/                        # obejrzyj, zapamietaj numery
#   ./fetch-certs.sh ustaw 37 kois-center.jpg
#
set -euo pipefail

BASE="https://sypien.pl/wp-content/uploads/2024/09/michalsypien-certyfikat"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PODGLAD="$HERE/_podglad"
MAX_KB=300

uzycie() {
  sed -n '3,17p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit 1
}

# Zmniejsza zdjecie ponizej MAX_KB. Uzywa sips (wbudowane w macOS)
# albo ImageMagick, zaleznie od tego co jest dostepne.
zmniejsz() {
  local plik="$1" szer=1200 jakosc=82
  for _ in 1 2 3 4; do
    local kb
    kb=$(( $(wc -c < "$plik") / 1024 ))
    [ "$kb" -le "$MAX_KB" ] && return 0
    if command -v magick >/dev/null 2>&1; then
      magick "$plik" -resize "${szer}x>" -quality "$jakosc" -strip "$plik"
    elif command -v convert >/dev/null 2>&1; then
      convert "$plik" -resize "${szer}x>" -quality "$jakosc" -strip "$plik"
    elif command -v sips >/dev/null 2>&1; then
      sips --resampleWidth "$szer" --setProperty formatOptions "$jakosc" "$plik" >/dev/null
    else
      echo "  ! brak sips/ImageMagick — zmniejsz plik recznie do <= ${MAX_KB} KB" >&2
      return 0
    fi
    szer=$(( szer * 8 / 10 ))
    jakosc=$(( jakosc - 8 ))
  done
}

case "${1:-}" in
  pobierz)
    od="${2:-1}"; do_="${3:-158}"
    mkdir -p "$PODGLAD"
    echo "Pobieram certyfikaty $od..$do_ do $PODGLAD"
    for n in $(seq "$od" "$do_"); do
      cel="$PODGLAD/certyfikat-$n.jpg"
      [ -s "$cel" ] && continue
      if curl -fsS --max-time 30 "$BASE-$n.jpg" -o "$cel" 2>/dev/null; then
        printf '  %3d  OK\n' "$n"
      else
        rm -f "$cel"
        printf '  %3d  brak\n' "$n"
      fi
    done
    echo
    echo "Gotowe. Obejrzyj: open \"$PODGLAD\""
    echo "Potem: ./fetch-certs.sh ustaw NUMER NAZWA.jpg"
    ;;

  ustaw)
    [ $# -eq 3 ] || uzycie
    numer="$2"; nazwa="$3"
    zrodlo="$PODGLAD/certyfikat-$numer.jpg"
    [ -s "$zrodlo" ] || { echo "Nie ma $zrodlo — najpierw './fetch-certs.sh pobierz'" >&2; exit 1; }
    cp "$zrodlo" "$HERE/$nazwa"
    zmniejsz "$HERE/$nazwa"
    echo "$nazwa  <-  certyfikat-$numer.jpg  ($(( $(wc -c < "$HERE/$nazwa") / 1024 )) KB)"
    echo "Dopisz numer $numer do tabeli w certs/README.md, zeby bylo wiadomo skad jest."
    ;;

  *) uzycie ;;
esac
