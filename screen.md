# Raport analizy kodu (projekt: Hah)

## Lista znalezionych problemów

- Bezpieczeństwo (serwery HTTP)
  - `CORS`: oba serwery (`Backned`, `excalidraw-room`) mają bardzo liberalną konfigurację (`origin: "*"` + `credentials: true`).
  - Autoryzacja administracyjna: użycie nagłówka `x-admin-token` bez standardu (brak Bearer, brak rotacji, brak TTL, brak rate-limiting). W `excalidraw-room` tokeny nauczycieli są logowane w konsoli przez `seedDefaults()` – ryzyko wycieku.
  - Generatory identyfikatorów i permalinków: stosowanie `Math.random().toString(36)` (łatwe do zgadnięcia, brak kryptograficznego źródła entropii).
  - Socket.IO: brak autoryzacji na wejście do pokoi (`join-room`), brak ograniczeń wielkości wiadomości, brak rate-limiting. Włączone `allowEIO3: true` rozszerza powierzchnię kompatybilności.
  - API scen (`POST /api/scenes/:roomId`): brak walidacji rozmiaru i struktury danych (poza prostym typem), brak kontroli dostępu (dowolny klient może zapisywać sceny pod dowolne `roomId`).
  - Iframe export (Excalidraw+) – weryfikacja JWT: parsowanie klucza publicznego i podpisu z wykorzystaniem `atob`/prostego `replace` na PEM może być kruche, brak jawnej obsługi błędów dla niespójnych ENV (np. pusty `VITE_APP_PLUS_APP`).

- Funkcjonalne/UX
  - Globalne wymuszenie `fill: none !important` dla ikon w toolbarze może psuć ikony, które celowo używają wypełnienia (np. ikony „Fill*”, logo, znaczniki statusu) – ryzyko regresji wizualnej.
  - Brak komunikatów UI w przypadku braku/nieprawidłowego `VITE_APP_PLUS_APP` – część odnośników i integracji może prowadzić do `about:blank` lub błędów.
  - Service Worker (`registerSW`) – brak informacji o aktualizacjach, możliwe przestarzałe cache i brak kontroli strategii (offline-first vs network-first).

- Architektoniczne/organizacyjne
  - Duplikacja odpowiedzialności między `Backned` (SQLite) i `excalidraw-room` (PostgreSQL) – podobne endpointy dla scen i permalinków, różne bazy, różne zasady. Trudne do utrzymania, niespójne zachowania.
  - Brak wspólnego modułu walidacji danych (np. Zod/Joi) – rozproszona i częściowa walidacja payloadów.
  - Brak centralnego loggera (mieszanka `debug` i `console.*`).

- Wydajność/stabilność
  - Limity `express.json({ limit: "2mb" })` w serwerach mogą być niewystarczające dla scen z obrazami (typowo kilka MB). Brak strumieniowego uploadu i mechanizmów „chunking”.
  - Brak kompresji odpowiedzi (gzip/br) i nagłówków cache tam, gdzie to sensowne.
  - Brak ograniczeń rozmiarów komunikatów WebSocket i polityk backpressure.

- DevOps/konfiguracja
  - Ostrzeżenie: „Browserslist data … 8 months old” – wymaga aktualizacji `caniuse-lite`.
  - W `excalidraw-room` port produkcyjny domyślnie `80` – potencjalne konflikty i wymaganie uprawnień root (zależnie od środowiska).

- Testy/jakość
  - `vitest.config.mts` – niskie progi pokrycia i brak testów E2E (np. Playwright) dla kolaboracji i eksportu.
  - Brak testów bezpieczeństwa (rate-limiting, kontrola dostępu, walidacja JWT) i testów integracyjnych dla API permalinków.

- Spójność frontendu
  - Brak twardych zabezpieczeń na poziomie UI dla nieustawionych ENV (np. dezaktywacja przycisków, komunikaty o brakujących integracjach).
  - Plik `CALC` bez rozszerzenia (a wygląda na komponent React z TSX) – trudny w integracji, ryzyko niebudowania przez bundler.

## Proponowane rozwiązania

- Wzmocnienie bezpieczeństwa
  - CORS: wprowadzić whitelistę domen, zrezygnować z `origin: "*"` przy `credentials: true`; w środowisku dev – przełącznik na bezpieczne wildcardy tylko dla lokalnych hostów.
  - Autoryzacja admina/nauczyciela: przejść na `Authorization: Bearer <token>`, dodać rotację/TTL tokenów, ograniczyć logowanie tajnych wartości; usunąć logowanie tokenów z `seedDefaults()`.
  - ID/permalinks: użyć `crypto.randomUUID()` lub `nanoid` (z bezpiecznym źródłem), wprowadzić minimalną długość i alfabet.
  - Socket.IO: dodać middleware autoryzacyjny (np. podpisany `roomKey`/HMAC), rate-limiting zdarzeń, walidację rozmiarów payloadów, wyłączyć `allowEIO3`.
  - API scen: rozważyć model „write with proof” (np. podpis klienta), walidację rozmiaru i schematu JSON (Zod), podstawowe ochrona przed nadużyciami (rate-limit per IP/room).
  - Iframe export/JWT: uodpornić parser PEM na różne formaty, dodać obsługę braku ENV (`VITE_APP_PLUS_APP`, `VITE_APP_PLUS_EXPORT_PUBLIC_KEY`) – fallback i komunikaty.

- Poprawa UX i spójności ikon
  - Zamiast globalnego `fill: none !important` ograniczyć reguły do konkretnych ikon w toolbarze (np. selektorem `.ToolIcon:not(.fillable) svg * { fill: none; }`).
  - Dodać ostrzegawcze UI/banery, jeśli brakuje krytycznych ENV – w szczególności linków do Excalidraw+.
  - Service Worker: wdrożyć strategię aktualizacji (prompt/auto), wersjonowanie cache i jasne komunikaty o nowej wersji.

- Uporządkowanie architektury backendów
  - Ujednolicić warstwę API w jednym serwisie (wybrać PostgreSQL lub SQLite z file-based dla dev). Zestawić wspólne schematy, walidację i autoryzację.
  - Wyodrębnić moduł walidacji (Zod/Joi) i wspólne typy (TS) dla payloadów.
  - Wprowadzić centralny logger (pino/winston) + korelacja żądań (request-id).

- Wydajność/stabilność
  - Podnieść limity payloadów z rozwagą (np. `10mb`) i rozważyć upload strumieniowy dla dużych danych (obrazy) lub przesyłanie plików poza JSON (multipart, S3). 
  - Włączyć kompresję odpowiedzi (`compression`), dodać cache-control na statyczne zasoby.
  - Wprowadzić backpressure i ograniczenia rozmiaru wiadomości WebSocket.

- DevOps i konfiguracja
  - Zaktualizować `caniuse-lite`: `npx update-browserslist-db@latest` i podpiąć do CI.
  - Zmienić domyślny port prod z `80` na konfigurowalny (ENV), użyć reverse proxy (nginx) do terminacji TLS i CORS.

- Testy
  - Dodać testy E2E (Playwright) dla: 
    - kolaboracji (wejście do pokoju, synchronizacja sceny),
    - eksportu do Excalidraw+ (komunikacja iframe/JWT),
    - API permalinków (cykl życia).
  - Dodać testy bezpieczeństwa (rate-limit, nieautoryzowany dostęp).
  - Stopniowo podnieść progi pokrycia w `vitest.config.mts`.

- Spójność frontendu
  - Walidacja ENV w `App.tsx` (lub wrapperze) i warunkowa aktywacja funkcji.
  - Zmienić nazwę `CALC` na `CALC.tsx` i przenieść do odpowiedniego modułu/UI (lub usunąć jeśli nieużywane).

## Sugerowane ulepszenia funkcjonalne i technologiczne

- Funkcjonalne
  - Panel nauczyciela (UI): zarządzanie permalinkami, przegląd studentów, dezaktywacja linków, eksport scen do archiwum.
  - Monitoring kolaboracji: wskaźniki opóźnień, liczba uczestników, alerty o rozłączeniach.
  - Tryb „readonly” dla obserwatorów (bez możliwości broadcastu).

- Technologiczne
  - Migracja do jednolitego backendu z PostgreSQL/Supabase (auth, storage, row-level security).
  - Wprowadzenie schematów Zod + generowanie typów i kontraktów OpenAPI.
  - Standaryzacja logów (JSON) + kolektor (ELK/CloudWatch), metryki (Prometheus).
  - Hardened Socket.IO (auth middleware, ograniczenia, audyt zdarzeń).
  - CI/CD: lint/test/preview z automatycznym odświeżeniem `browserslist` i bezpieczeństwa.

- Jakość kodu
  - Wspólny styl dla ikon (props `tablerIconProps`) i selektywne reguły CSS zamiast globalnego `!important`.
  - Odporność na brak ENV (feature flags), wyraźne komunikaty błędów w UI.

---

Ten raport nie zawiera gotowych fragmentów kodu; skupia się na identyfikacji problemów oraz rekomendacjach ich rozwiązania. Po akceptacji kierunków mogę przygotować konkretne zmiany (PR-y) w wybranych modułach.