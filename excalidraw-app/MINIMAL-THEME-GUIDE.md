# 🎨 Minimalistyczny Theme Wrapper - Instrukcja

## 📁 Pliki do edycji

### Główny plik stylów:
**`minimal-theme-wrapper.scss`** - TU WPROWADZASZ WSZYSTKIE ZMIANY

### Plik przykładu:
**`minimal-theme-example.html`** - przykład użycia

---

## 🛠️ Jak edytować wygląd

### 1. 🎯 GŁÓWNE KOLORY (linie 9-14)
```scss
--color-primary: #000000;                    /* Główny kolor - ZMIEŃ TUTAJ */
--color-primary-darker: #333333;             /* Ciemniejszy odcień */
--color-primary-darkest: #666666;            /* Najciemniejszy odcień */
--color-primary-light: #f5f5f5;              /* Jasny odcień */
--color-primary-hover: #1a1a1a;              /* Kolor hover */
```

**Przykłady kolorów:**
- Niebieski: `#2196F3`
- Zielony: `#4CAF50`
- Czerwony: `#F44336`
- Fioletowy: `#9C27B0`

### 2. 🏠 TŁO I POWIERZCHNIE (linie 16-21)
```scss
--default-bg-color: #fafafa;                 /* Główne tło - ZMIEŃ TUTAJ */
--island-bg-color: #ffffff;                  /* Tło paneli - ZMIEŃ TUTAJ */
--popup-bg-color: #ffffff;                   /* Tło popupów */
```

**Przykłady tła:**
- Jasne: `#ffffff`, `#f8f9fa`, `#fafafa`
- Ciemne: `#1a1a1a`, `#2d2d2d`, `#424242`
- Kolorowe: `#f0f8ff`, `#f5f5dc`, `#fff8dc`

### 3. ✏️ KOLORY TEKSTU (linie 23-26)
```scss
--text-primary-color: #212529;               /* Główny kolor tekstu - ZMIEŃ TUTAJ */
--popup-text-color: #212529;                 /* Tekst w popupach */
```

### 4. 🔘 PRZYCISKI I RAMKI (linie 28-33)
```scss
--button-hover-bg: #f8f9fa;                  /* Tło przycisku przy hover */
--button-active-bg: #e9ecef;                 /* Tło aktywnego przycisku */
--button-active-border: #000000;             /* Ramka aktywnego przycisku */
--default-border-color: #e0e0e0;             /* Domyślny kolor ramki - ZMIEŃ TUTAJ */
```

### 5. 📏 ROZMIARY I KSZTAŁTY (linie 35-41)
```scss
--default-button-size: 2.5rem;               /* Rozmiar przycisku - ZMIEŃ TUTAJ */
--default-icon-size: 1.25rem;                /* Rozmiar ikony - ZMIEŃ TUTAJ */
--border-radius-md: 4px;                     /* Zaokrąglenia - ZMIEŃ TUTAJ */
--border-radius-lg: 6px;                     /* Większe zaokrąglenia */
```

**Przykłady zaokrągleń:**
- Ostre krawędzie: `0px`
- Lekko zaokrąglone: `4px`
- Średnio zaokrąglone: `8px`
- Bardzo zaokrąglone: `16px`
- Okrągłe: `50%`

### 6. 🌫️ CIENIE (linie 43-46)
```scss
--shadow-island: 0 1px 3px rgba(0, 0, 0, 0.1);  /* Cień paneli - ZMIEŃ TUTAJ */
--modal-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);  /* Cień modali */
```

**Przykłady cieni:**
- Brak cienia: `none`
- Lekki cień: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Średni cień: `0 4px 6px rgba(0, 0, 0, 0.1)`
- Mocny cień: `0 10px 25px rgba(0, 0, 0, 0.15)`

---

## 🌙 Tryb ciemny (linie 51-71)

Aby zmienić kolory w trybie ciemnym, edytuj sekcję:
```scss
.excalidraw.theme--dark {
    --color-primary: #ffffff;                    /* Główny kolor w dark mode */
    --default-bg-color: #1a1a1a;                 /* Główne tło dark mode */
    --island-bg-color: #2d2d2d;                  /* Tło paneli dark mode */
    --text-primary-color: #e0e0e0;               /* Główny kolor tekstu */
    /* ... */
}
```

---

## 🎨 Zaawansowane modyfikacje

### 📊 TOOLBAR (linie 84-93)
```scss
.excalidraw .App-toolbar {
    background: var(--island-bg-color);
    border: 1px solid var(--default-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-island);
    padding: 0.5rem;
    
    /* Dodaj własne modyfikacje tutaj */
    /* Przykład: margin: 1rem; */
}
```

**Przykłady modyfikacji toolbar:**
```scss
/* Przezroczyste tło */
background: rgba(255, 255, 255, 0.9);
backdrop-filter: blur(10px);

/* Większe odstępy */
margin: 1rem;
padding: 1rem;

/* Inne pozycjonowanie */
position: fixed;
top: 20px;
left: 20px;
```

### 🔘 PRZYCISKI TOOLBAR (linie 95-109)
```scss
.excalidraw .ToolIcon__icon {
    &:hover {
        background: var(--button-hover-bg);
        /* Dodaj własne efekty hover tutaj */
    }
    
    &[aria-pressed="true"] {
        background: var(--button-active-bg);
        border: 1px solid var(--button-active-border);
        /* Dodaj style dla aktywnych przycisków tutaj */
    }
}
```

**Przykłady efektów:**
```scss
/* Efekt powiększenia */
&:hover {
    transform: scale(1.05);
}

/* Efekt świecenia */
&[aria-pressed="true"] {
    box-shadow: 0 0 10px var(--color-primary);
}

/* Efekt obrotu */
&:hover {
    transform: rotate(5deg);
}
```

### 🎯 CANVAS (linie 111-119)
```scss
.excalidraw .excalidraw__canvas {
    /* Dodaj własne style canvas tutaj */
}
```

**Przykłady tła canvas:**
```scss
/* Tło w kratkę */
background-image: 
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
background-size: 20px 20px;

/* Gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Tekstura papieru */
background: #fafafa url('data:image/svg+xml,<svg>...</svg>');
```

---

## 🚀 Jak używać

### 1. Podstawowe użycie
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="./index.scss">
    <link rel="stylesheet" href="./minimal-theme-wrapper.scss">
</head>
<body>
    <div class="excalidraw-minimal-wrapper">
        <div id="excalidraw-container"></div>
    </div>
</body>
</html>
```

### 2. Z React
```jsx
import './minimal-theme-wrapper.scss';

function App() {
    return (
        <div className="excalidraw-minimal-wrapper">
            <Excalidraw />
        </div>
    );
}
```

### 3. Przełączanie trybu ciemnego
```javascript
const excalidrawElement = document.querySelector('.excalidraw');
excalidrawElement.classList.toggle('theme--dark');
```

---

## 📱 Responsywność

System automatycznie dostosowuje się do różnych ekranów:
- **Tablety** (768px): mniejsze przyciski i ikony
- **Telefony** (480px): jeszcze mniejsze elementy

Możesz dostosować te wartości w sekcji responsywności (linie 180-194).

---

## 💡 Szybkie wskazówki

1. **Zawsze zapisuj plik** po wprowadzeniu zmian
2. **Odśwież przeglądarkę** aby zobaczyć zmiany
3. **Używaj narzędzi deweloperskich** (F12) do testowania
4. **Kopiuj zmienne CSS** z innych sekcji dla spójności
5. **Testuj w trybie ciemnym** - pamiętaj o obu trybach

---

## 🎯 Najczęstsze zmiany

### Zmiana głównego koloru na niebieski:
```scss
--color-primary: #2196F3;
--color-primary-darker: #1976D2;
--color-primary-darkest: #0D47A1;
```

### Zmiana tła na ciemne:
```scss
--default-bg-color: #2d2d2d;
--island-bg-color: #424242;
--text-primary-color: #ffffff;
```

### Większe przyciski:
```scss
--default-button-size: 3rem;
--default-icon-size: 1.5rem;
```

### Mocniejsze zaokrąglenia:
```scss
--border-radius-md: 12px;
--border-radius-lg: 16px;
```

---

**Miłej personalizacji! 🎨**