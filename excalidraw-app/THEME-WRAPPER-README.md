# 🎨 Excalidraw Theme Wrapper

## Opis

System **Theme Wrapper** pozwala na kompletne przeprojektowanie wyglądu Excalidraw bez modyfikacji kodu źródłowego. Wykorzystuje CSS Custom Properties (zmienne CSS) i nadpisywanie klas CSS, aby umożliwić pełną personalizację interfejsu.

## ✨ Funkcje

- 🎯 **Kompletna personalizacja** - zmień kolory, fonty, cienie, animacje
- 🌙 **Wsparcie trybu ciemnego** - automatyczne dostosowanie do dark mode
- 📱 **Responsywność** - optymalizacja dla urządzeń mobilnych
- 🔧 **Bez modyfikacji kodu** - nie wymaga przebudowy Excalidraw
- 🎨 **Gotowe theme** - 8 predefiniowanych stylów
- ⚡ **Wydajność** - wykorzystuje CSS Custom Properties
- 🔄 **Łatwa integracja** - wystarczy zaimportować jeden plik

## 📁 Pliki

```
excalidraw-app/
├── theme-wrapper.scss              # Główny plik z systemem theme
├── theme-wrapper-example.html      # Przykład implementacji
└── THEME-WRAPPER-README.md         # Ta dokumentacja
```

## 🚀 Szybki start

### 1. Podstawowa implementacja

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Import stylów Excalidraw -->
    <link rel="stylesheet" href="./index.scss">
    
    <!-- Import Theme Wrapper -->
    <link rel="stylesheet" href="./theme-wrapper.scss">
</head>
<body>
    <!-- Owinięcie Excalidraw w wrapper -->
    <div class="excalidraw-theme-wrapper">
        <div id="excalidraw-container"></div>
    </div>
</body>
</html>
```

### 2. Personalizacja kolorów

```css
.excalidraw-theme-wrapper .excalidraw {
    /* Zmień główny kolor brandowy */
    --color-primary: #your-color;
    --color-primary-darker: #your-darker-color;
    --color-primary-darkest: #your-darkest-color;
    --color-primary-light: #your-light-color;
    
    /* Zmień tło */
    --default-bg-color: #your-background;
    --island-bg-color: #your-panel-background;
}
```

### 3. Tryb ciemny

```css
.excalidraw-theme-wrapper .excalidraw.theme--dark {
    --color-primary: #your-dark-theme-primary;
    --default-bg-color: #your-dark-background;
    /* ... inne zmienne dla trybu ciemnego */
}
```

## 🎨 Dostępne zmienne CSS

### Główne kolory
```css
--color-primary                 /* Główny kolor brandowy */
--color-primary-darker          /* Ciemniejszy odcień */
--color-primary-darkest         /* Najciemniejszy odcień */
--color-primary-light           /* Jasny odcień */
--color-primary-hover           /* Kolor hover */
```

### Tła i powierzchnie
```css
--default-bg-color              /* Główne tło aplikacji */
--island-bg-color               /* Tło paneli/wysp */
--popup-bg-color                /* Tło popupów */
--overlay-bg-color              /* Tło overlay */
--color-surface-high            /* Wysoka powierzchnia */
--color-surface-mid             /* Średnia powierzchnia */
--color-surface-low             /* Niska powierzchnia */
```

### Kolory tekstu
```css
--text-primary-color            /* Główny kolor tekstu */
--popup-text-color              /* Tekst w popupach */
--color-on-surface              /* Tekst na powierzchni */
```

### Przyciski i kontrolki
```css
--button-hover-bg               /* Tło przycisku przy hover */
--button-active-bg              /* Tło aktywnego przycisku */
--button-active-border          /* Ramka aktywnego przycisku */
--default-border-color          /* Domyślny kolor ramki */
```

### Rozmiary i odstępy
```css
--default-button-size           /* Rozmiar domyślnego przycisku */
--default-icon-size             /* Rozmiar domyślnej ikony */
--space-factor                  /* Podstawowy odstęp */
--border-radius-md              /* Średni border-radius */
--border-radius-lg              /* Duży border-radius */
```

## 🎯 Przykłady theme

### Theme niebieski
```css
.theme-blue .excalidraw {
    --color-primary: #4285f4;
    --color-primary-darker: #3367d6;
    --color-primary-darkest: #1a73e8;
    --color-primary-light: #e8f0fe;
}
```

### Theme minimalistyczny
```css
.theme-minimal .excalidraw {
    --color-primary: #000000;
    --color-primary-darker: #333333;
    --island-bg-color: #ffffff;
    --default-bg-color: #fafafa;
}

.theme-minimal .excalidraw .App-toolbar {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### Theme glassmorphism
```css
.theme-glass .excalidraw .App-toolbar,
.theme-glass .excalidraw .dropdown-menu {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
```

## 🔧 Zaawansowane modyfikacje

### Niestandardowe tło canvas
```css
.excalidraw-theme-wrapper .excalidraw .excalidraw__canvas {
    /* Papier milimetrowy */
    background-image: 
        linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    
    /* Gradient */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Niestandardowe animacje
```css
.excalidraw-theme-wrapper .excalidraw .ToolIcon__icon {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
        transform: scale(1.05) rotate(5deg);
    }
}
```

### Efekt świecenia
```css
.excalidraw-theme-wrapper .excalidraw .ToolIcon__icon[aria-pressed="true"] {
    box-shadow: 
        0 0 20px rgba(255, 107, 107, 0.3),
        0 0 40px rgba(255, 107, 107, 0.2);
}
```

### Niestandardowe fonty
```css
.excalidraw-theme-wrapper .excalidraw {
    --ui-font: 'Poppins', 'Inter', sans-serif;
    font-family: var(--ui-font);
}
```

## 📱 Responsywność

System automatycznie dostosowuje się do różnych rozmiarów ekranu:

```css
@media (max-width: 768px) {
    .excalidraw-theme-wrapper .excalidraw {
        --default-button-size: 2rem;
        --default-icon-size: 1rem;
    }
}

@media (max-width: 480px) {
    .excalidraw-theme-wrapper .excalidraw {
        --default-button-size: 1.75rem;
        --default-icon-size: 0.875rem;
    }
}
```

## 🎮 Interaktywny przykład

Plik `theme-wrapper-example.html` zawiera pełny przykład z:

- 8 predefiniowanych theme
- Przełączanie theme przyciskami
- Skróty klawiszowe (Ctrl+Shift+1-8)
- Automatyczne przełączanie theme
- Demonstracja wszystkich funkcji

### Uruchomienie przykładu

```bash
# Otwórz plik w przeglądarce
open theme-wrapper-example.html

# Lub uruchom lokalny serwer
npx serve .
```

## 🔄 Integracja z istniejącym projektem

### React
```jsx
import './theme-wrapper.scss';

function App() {
    const [theme, setTheme] = useState('');
    
    return (
        <div className={`excalidraw-theme-wrapper ${theme}`}>
            <Excalidraw />
        </div>
    );
}
```

### Vue.js
```vue
<template>
    <div :class="`excalidraw-theme-wrapper ${currentTheme}`">
        <Excalidraw />
    </div>
</template>

<script>
import './theme-wrapper.scss';

export default {
    data() {
        return {
            currentTheme: ''
        }
    }
}
</script>
```

### Angular
```typescript
// app.component.ts
import './theme-wrapper.scss';

@Component({
    template: `
        <div [class]="'excalidraw-theme-wrapper ' + currentTheme">
            <excalidraw></excalidraw>
        </div>
    `
})
export class AppComponent {
    currentTheme = '';
}
```

## 🎨 Tworzenie własnych theme

### 1. Stwórz nową klasę theme
```css
.my-custom-theme .excalidraw {
    /* Twoje zmienne CSS */
    --color-primary: #your-color;
    /* ... */
}
```

### 2. Dodaj tryb ciemny
```css
.my-custom-theme .excalidraw.theme--dark {
    /* Zmienne dla trybu ciemnego */
    --color-primary: #your-dark-color;
    /* ... */
}
```

### 3. Zastosuj theme
```html
<div class="excalidraw-theme-wrapper my-custom-theme">
    <!-- Excalidraw -->
</div>
```

## 🛠️ Narzędzia deweloperskie

### Debugowanie zmiennych CSS
```javascript
// Sprawdź wartości zmiennych CSS
const excalidrawElement = document.querySelector('.excalidraw');
const styles = getComputedStyle(excalidrawElement);
console.log('Primary color:', styles.getPropertyValue('--color-primary'));
```

### Dynamiczna zmiana theme
```javascript
function changeTheme(newTheme) {
    const wrapper = document.querySelector('.excalidraw-theme-wrapper');
    wrapper.className = `excalidraw-theme-wrapper ${newTheme}`;
}

// Użycie
changeTheme('theme-blue');
```

### Zapisywanie preferencji użytkownika
```javascript
// Zapisz theme w localStorage
function saveTheme(theme) {
    localStorage.setItem('excalidraw-theme', theme);
}

// Wczytaj theme z localStorage
function loadTheme() {
    return localStorage.getItem('excalidraw-theme') || '';
}
```

## 🔍 Rozwiązywanie problemów

### Problem: Zmienne CSS nie działają
**Rozwiązanie:** Upewnij się, że wrapper ma wyższą specyficzność:
```css
.your-app .excalidraw-theme-wrapper .excalidraw {
    --color-primary: #your-color;
}
```

### Problem: Style nie są stosowane
**Rozwiązanie:** Sprawdź kolejność importów CSS:
```html
<!-- Najpierw style Excalidraw -->
<link rel="stylesheet" href="excalidraw-styles.css">
<!-- Potem theme wrapper -->
<link rel="stylesheet" href="theme-wrapper.scss">
```

### Problem: Tryb ciemny nie działa
**Rozwiązanie:** Upewnij się, że klasa `.theme--dark` jest dodawana:
```css
.excalidraw-theme-wrapper .excalidraw.theme--dark {
    /* Twoje zmienne dla trybu ciemnego */
}
```

## 📚 Dodatkowe zasoby

- [Excalidraw Documentation](https://docs.excalidraw.com/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [CSS Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)
- [SCSS Documentation](https://sass-lang.com/documentation)

## 🤝 Wkład w rozwój

Jeśli chcesz dodać nowe theme lub poprawić istniejące:

1. Stwórz nową klasę theme w `theme-wrapper.scss`
2. Dodaj przykład w `theme-wrapper-example.html`
3. Zaktualizuj dokumentację
4. Przetestuj na różnych urządzeniach

## 📄 Licencja

Ten system theme wrapper jest dostępny na tej samej licencji co Excalidraw.

---

**🎨 Miłego personalizowania Excalidraw!**

Jeśli masz pytania lub sugestie, stwórz issue w repozytorium projektu.