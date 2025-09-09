# Excalidraw Backend API

Minimalistyczny serwis API dla Excalidraw z obsługą SQLite.

## Uruchomienie

1. Zainstaluj zależności:
```bash
npm install
```

2. Skonfiguruj zmienne środowiskowe (skopiuj `.env.example` do `.env`):
```
PORT=3005
CORS_ORIGIN=http://localhost:5173
DATABASE_PATH=./excalidraw.db
```

3. Uruchom serwer:
```bash
npm run dev
```

Serwer będzie dostępny pod adresem: http://localhost:3005

## API Endpoints

### Sceny
- `GET /api/scenes/:roomId` - Pobierz dane sceny
- `POST /api/scenes/:roomId` - Zapisz dane sceny

### Permalinki
- `POST /api/permalinks` - Utwórz permalink
- `GET /api/permalinks/:permalink` - Rozwiąż permalink

## Przykłady użycia

### Zapisz scenę:
```bash
curl -X POST http://localhost:3005/api/scenes/test-room \
  -H "Content-Type: application/json" \
  -d '{"scene_version": 1, "iv": "test-iv", "ciphertext": "encrypted-data"}'
```

### Pobierz scenę:
```bash
curl http://localhost:3005/api/scenes/test-room
```

### Utwórz permalink:
```bash
curl -X POST http://localhost:3005/api/permalinks \
  -H "Content-Type: application/json" \
  -d '{"room_id": "test-room", "room_key": "key", "student_name": "Jan"}'
```

### Rozwiąż permalink:
```bash
curl http://localhost:3005/api/permalinks/PERMALINK_ID
```

## Struktura bazy danych

### Tabela `scenes`
- `room_id` (TEXT, PRIMARY KEY)
- `scene_version` (INTEGER)
- `iv` (TEXT) - initialization vector dla szyfrowania
- `ciphertext` (TEXT) - zaszyfrowane dane sceny
- `created_at`, `updated_at` (DATETIME)

### Tabela `permalinks`
- `permalink` (TEXT, PRIMARY KEY)
- `room_id` (TEXT)
- `room_key` (TEXT)
- `student_name` (TEXT, opcjonalne)
- `created_at`, `last_accessed` (DATETIME)
- `is_active` (INTEGER, domyślnie 1)