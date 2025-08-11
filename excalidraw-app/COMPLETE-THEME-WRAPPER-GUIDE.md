# 🎨 Excalidraw Theme Wrapper - Kompletny Przewodnik

## 📋 Spis treści

1. [Wprowadzenie](#wprowadzenie)
2. [Struktura plików](#struktura-plików)
3. [Szybki start](#szybki-start)
4. [Konfiguracja](#konfiguracja)
5. [Integracja z frameworkami](#integracja-z-frameworkami)
6. [Dostępne theme](#dostępne-theme)
7. [Zaawansowane funkcje](#zaawansowane-funkcje)
8. [API Reference](#api-reference)
9. [Przykłady użycia](#przykłady-użycia)
10. [Rozwiązywanie problemów](#rozwiązywanie-problemów)
11. [Wkład w rozwój](#wkład-w-rozwój)

## 🚀 Wprowadzenie

Excalidraw Theme Wrapper to kompletny system do stylizacji aplikacji Excalidraw bez konieczności modyfikacji kodu źródłowego. System umożliwia:

- ✅ **Kompletną personalizację** - kolory, tła, ikony, cienie
- ✅ **Wsparcie dla trybu ciemnego** - automatyczne przełączanie
- ✅ **Responsywność** - dostosowanie do różnych rozmiarów ekranu
- ✅ **Brak modyfikacji kodu źródłowego** - overlay system
- ✅ **Gotowe theme** - 8+ predefiniowanych stylów
- ✅ **Wysoką wydajność** - optymalizowane CSS
- ✅ **Łatwą integrację** - wsparcie dla React, Vue, Angular
- ✅ **Skróty klawiszowe** - szybkie przełączanie theme
- ✅ **Eksport/Import** - zapisywanie konfiguracji

## 📁 Struktura plików

```
excalidraw-theme-wrapper/
├── theme-wrapper.scss              # Główny plik stylów
├── theme-wrapper.js                # JavaScript helper
├── theme-wrapper-example.html      # Przykład HTML
├── react-theme-example.jsx         # Integracja React
├── vue-theme-example.vue           # Integracja Vue.js
├── angular-theme-example.component.ts # Integracja Angular
├── THEME-WRAPPER-README.md         # Podstawowa dokumentacja
└── COMPLETE-THEME-WRAPPER-GUIDE.md # Ten przewodnik
```

## ⚡ Szybki start

### 1. Podstawowa instalacja

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Załaduj style Excalidraw -->
    <link rel="stylesheet" href="path/to/excalidraw.css">
    <!-- Załaduj theme wrapper -->
    <link rel="stylesheet" href="theme-wrapper.scss">
</head>
<body>
    <!-- Kontener z klasą wrapper -->
    <div class="excalidraw-theme-wrapper theme-blue">
        <div id="excalidraw-app"></div>
    </div>
    
    <!-- Załaduj JavaScript -->
    <script src="theme-wrapper.js"></script>
    <script>
        // Inicjalizuj theme manager
        const themeManager = new ExcalidrawThemeManager();
        
        // Ustaw theme
        themeManager.setTheme('blue');
    </script>
</body>
</html>
```

### 2. Szybka konfiguracja

```javascript
// Podstawowa konfiguracja
const themeManager = new ExcalidrawThemeManager({
    defaultTheme: 'blue',
    autoSave: true,
    containerSelector: '.excalidraw-theme-wrapper'
});

// Zmień theme
themeManager.setTheme('green');

// Dodaj callback
themeManager.on('onThemeChange', (newTheme) => {
    console.log('Theme zmieniony na:', newTheme);
});
```

## ⚙️ Konfiguracja

### Opcje ExcalidrawThemeManager

```javascript
const options = {
    // Selektor kontenera (wymagany)
    containerSelector: '.excalidraw-theme-wrapper',
    
    // Klucz localStorage dla zapisywania theme
    storageKey: 'excalidraw-theme',
    
    // Domyślny theme
    defaultTheme: '',
    
    // Automatyczne zapisywanie w localStorage
    autoSave: true,
    
    // Niestandardowe theme
    customThemes: {
        'my-theme': 'my-custom-theme-class'
    }
};

const themeManager = new ExcalidrawThemeManager(options);
```

### Zmienne CSS do personalizacji

```scss
.excalidraw-theme-wrapper {
    // Kolory główne
    --color-primary: #6965db;
    --color-primary-darker: #5b57d1;
    --color-primary-darkest: #4c47c4;
    
    // Tła
    --default-bg-color: #ffffff;
    --island-bg-color: #f8f9fa;
    
    // Tekst
    --text-primary-color: #1e1e1e;
    --text-secondary-color: #6c757d;
    
    // Przyciski
    --button-hover-bg: #f8f9fa;
    --button-active-bg: #e9ecef;
    
    // Cienie
    --shadow-island: 0 4px 20px rgba(0, 0, 0, 0.15);
    --shadow-floating: 0 8px 40px rgba(0, 0, 0, 0.2);
}
```

## 🔧 Integracja z frameworkami

### React

```jsx
import { ExcalidrawWithTheme } from './react-theme-example.jsx';

function App() {
    return (
        <ExcalidrawWithTheme 
            themeOptions={{ defaultTheme: 'blue' }}
            showThemeControls={true}
            onChange={(elements, appState) => {
                console.log('Excalidraw changed:', elements, appState);
            }}
        />
    );
}
```

### Vue.js

```vue
<template>
    <ExcalidrawVueTheme 
        :theme-options="{ defaultTheme: 'green' }"
        :show-theme-controls="true"
        @theme-changed="onThemeChanged"
    />
</template>

<script>
import ExcalidrawVueTheme from './vue-theme-example.vue';

export default {
    components: { ExcalidrawVueTheme },
    methods: {
        onThemeChanged(theme) {
            console.log('Theme changed:', theme);
        }
    }
};
</script>
```

### Angular

```typescript
// app.module.ts
import { ExcalidrawThemeModule } from './angular-theme-example.component';

@NgModule({
    imports: [ExcalidrawThemeModule]
})
export class AppModule {}

// app.component.html
<app-excalidraw-with-theme 
    [themeOptions]="{ defaultTheme: 'purple' }"
    [showThemeControls]="true"
    (themeChanged)="onThemeChanged($event)"
></app-excalidraw-with-theme>
```

## 🎨 Dostępne theme

### Predefiniowane theme

| Theme | Klasa CSS | Opis |
|-------|-----------|------|
| **Default** | `` | Domyślny styl Excalidraw |
| **Blue** | `theme-blue` | Niebieski theme z gradientami |
| **Green** | `theme-green` | Zielony theme inspirowany naturą |
| **Purple** | `theme-purple` | Fioletowy theme z neonowymi akcentami |
| **Orange** | `theme-orange` | Pomarańczowy theme energetyczny |
| **Glass** | `theme-glass` | Przezroczysty theme z efektem szkła |
| **Neon** | `theme-neon` | Ciemny theme z neonowymi kolorami |
| **Minimal** | `theme-minimal` | Minimalistyczny theme |

### Przykłady użycia theme

```javascript
// Przełączanie między theme
themeManager.setTheme('blue');     // Niebieski
themeManager.setTheme('green');    // Zielony
themeManager.setTheme('glass');    // Przezroczysty

// Nawigacja theme
themeManager.nextTheme();          // Następny
themeManager.previousTheme();      // Poprzedni
themeManager.randomTheme();        // Losowy
```

### Tworzenie własnych theme

```scss
// Dodaj własny theme
.excalidraw-theme-wrapper.theme-custom {
    --color-primary: #ff6b6b;
    --color-primary-darker: #ff5252;
    --default-bg-color: #fff5f5;
    --island-bg-color: #ffe0e0;
    --text-primary-color: #2d3748;
    
    // Niestandardowe style
    .excalidraw .App-toolbar {
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        border-radius: 12px;
    }
}
```

```javascript
// Zarejestruj theme w JavaScript
themeManager.addTheme('custom', 'theme-custom');
themeManager.setTheme('custom');
```

## 🔥 Zaawansowane funkcje

### 1. Dynamiczne zmienne CSS

```javascript
// Ustaw niestandardowy kolor
themeManager.setCSSVariable('--color-primary', '#ff0000');
themeManager.setCSSVariable('--default-bg-color', '#f0f0f0');

// Pobierz aktualne zmienne
const variables = themeManager.getCSSVariables();
console.log(variables);

// Resetuj wszystkie zmienne
themeManager.resetCSSVariables();
```

### 2. Eksport i import konfiguracji

```javascript
// Eksportuj konfigurację
const config = themeManager.exportConfig();
console.log(config);

// Zapisz do pliku
const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json'
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-theme-config.json';
a.click();

// Importuj konfigurację
fetch('my-theme-config.json')
    .then(response => response.json())
    .then(config => {
        themeManager.importConfig(config);
    });
```

### 3. Callback i eventy

```javascript
// Dodaj callback dla zmiany theme
themeManager.on('onThemeChange', (newTheme) => {
    console.log('Theme zmieniony:', newTheme);
    // Zapisz w analytics
    analytics.track('theme_changed', { theme: newTheme });
});

// Callback dla załadowania theme
themeManager.on('onThemeLoad', (theme) => {
    console.log('Theme załadowany:', theme);
});

// Callback dla zmiany trybu ciemnego
themeManager.on('onDarkModeChange', (isDark) => {
    console.log('Tryb ciemny:', isDark);
});

// Usuń callback
const callback = (theme) => console.log(theme);
themeManager.on('onThemeChange', callback);
themeManager.off('onThemeChange', callback);
```

### 4. Skróty klawiszowe

```javascript
// Automatyczne skróty klawiszowe
addThemeKeyboardShortcuts(themeManager);

// Niestandardowe skróty
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key === 'T') {
        themeManager.nextTheme();
    }
    
    if (e.ctrlKey && e.altKey && e.key === 'R') {
        themeManager.randomTheme();
    }
});
```

| Skrót | Akcja |
|-------|-------|
| `Ctrl+Shift+T` | Następny theme |
| `Ctrl+Shift+R` | Losowy theme |
| `Ctrl+Shift+1-8` | Konkretny theme (1-8) |

### 5. Responsywność i media queries

```scss
.excalidraw-theme-wrapper {
    // Desktop
    @media (min-width: 1024px) {
        --island-bg-color: rgba(255, 255, 255, 0.9);
        --shadow-island: 0 8px 32px rgba(0, 0, 0, 0.12);
    }
    
    // Tablet
    @media (max-width: 1023px) and (min-width: 768px) {
        --island-bg-color: rgba(255, 255, 255, 0.95);
        --shadow-island: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    // Mobile
    @media (max-width: 767px) {
        --island-bg-color: #ffffff;
        --shadow-island: 0 2px 8px rgba(0, 0, 0, 0.08);
        
        .excalidraw .App-toolbar {
            padding: 0.5rem;
        }
    }
}
```

## 📚 API Reference

### ExcalidrawThemeManager

#### Constructor
```javascript
new ExcalidrawThemeManager(options)
```

#### Metody

| Metoda | Parametry | Opis |
|--------|-----------|------|
| `setTheme(name)` | `name: string` | Ustaw theme |
| `getCurrentTheme()` | - | Pobierz aktualny theme |
| `getAvailableThemes()` | - | Pobierz dostępne theme |
| `nextTheme()` | - | Następny theme |
| `previousTheme()` | - | Poprzedni theme |
| `randomTheme()` | - | Losowy theme |
| `addTheme(name, className)` | `name: string, className: string` | Dodaj theme |
| `removeTheme(name)` | `name: string` | Usuń theme |
| `setCSSVariable(name, value)` | `name: string, value: string` | Ustaw zmienną CSS |
| `getCSSVariables()` | - | Pobierz zmienne CSS |
| `resetCSSVariables()` | - | Resetuj zmienne CSS |
| `exportConfig()` | - | Eksportuj konfigurację |
| `importConfig(config)` | `config: object` | Importuj konfigurację |
| `on(event, callback)` | `event: string, callback: function` | Dodaj callback |
| `off(event, callback)` | `event: string, callback: function` | Usuń callback |

#### Eventy

| Event | Parametry | Opis |
|-------|-----------|------|
| `onThemeChange` | `theme: string` | Theme został zmieniony |
| `onThemeLoad` | `theme: string` | Theme został załadowany |
| `onDarkModeChange` | `isDark: boolean` | Tryb ciemny się zmienił |

### Funkcje pomocnicze

```javascript
// Stwórz selektor theme
createThemeSelector(container, themeManager);

// Stwórz przyciski theme
createThemeButtons(container, themeManager);

// Dodaj skróty klawiszowe
addThemeKeyboardShortcuts(themeManager);

// Hook dla React
const useExcalidrawTheme = createReactThemeHook(themeManager);
```

## 💡 Przykłady użycia

### 1. Prosta strona z przełącznikiem theme

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="theme-wrapper.scss">
    <style>
        .theme-switcher {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="theme-switcher">
        <select id="theme-select">
            <option value="">Default</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
        </select>
    </div>
    
    <div class="excalidraw-theme-wrapper" id="app">
        <!-- Excalidraw tutaj -->
    </div>
    
    <script src="theme-wrapper.js"></script>
    <script>
        const themeManager = new ExcalidrawThemeManager();
        const select = document.getElementById('theme-select');
        
        select.addEventListener('change', (e) => {
            themeManager.setTheme(e.target.value);
        });
        
        themeManager.on('onThemeChange', (theme) => {
            const themeName = Object.keys(themeManager.getAvailableThemes())
                .find(key => themeManager.getAvailableThemes()[key] === theme) || '';
            select.value = themeName;
        });
    </script>
</body>
</html>
```

### 2. React z zaawansowanymi kontrolkami

```jsx
import React from 'react';
import { useExcalidrawTheme } from './react-theme-example.jsx';

function AdvancedThemeControls() {
    const {
        currentTheme,
        setTheme,
        availableThemes,
        nextTheme,
        randomTheme
    } = useExcalidrawTheme();
    
    const [customColor, setCustomColor] = React.useState('#6965db');
    
    const handleColorChange = (color) => {
        setCustomColor(color);
        // Ustaw niestandardowy kolor
        document.documentElement.style.setProperty('--color-primary', color);
    };
    
    return (
        <div className="advanced-controls">
            <div className="theme-buttons">
                {Object.entries(availableThemes).map(([name, className]) => (
                    <button
                        key={name}
                        onClick={() => setTheme(name)}
                        className={className === currentTheme ? 'active' : ''}
                    >
                        {name}
                    </button>
                ))}
            </div>
            
            <div className="theme-actions">
                <button onClick={nextTheme}>Następny</button>
                <button onClick={randomTheme}>Losowy</button>
            </div>
            
            <div className="color-picker">
                <label>Niestandardowy kolor:</label>
                <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                />
            </div>
        </div>
    );
}
```

### 3. Vue.js z Composition API

```vue
<template>
    <div class="theme-playground">
        <div class="controls">
            <button 
                v-for="(className, name) in availableThemes" 
                :key="name"
                @click="setTheme(name)"
                :class="{ active: className === currentTheme }"
            >
                {{ name }}
            </button>
        </div>
        
        <div class="excalidraw-theme-wrapper" :class="currentTheme">
            <!-- Excalidraw component -->
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const currentTheme = ref('');
const availableThemes = ref({});
let themeManager = null;

onMounted(() => {
    themeManager = new ExcalidrawThemeManager({
        defaultTheme: 'blue'
    });
    
    availableThemes.value = themeManager.getAvailableThemes();
    
    themeManager.on('onThemeChange', (theme) => {
        currentTheme.value = theme;
    });
});

onUnmounted(() => {
    if (themeManager) {
        // Cleanup
    }
});

const setTheme = (name) => {
    if (themeManager) {
        themeManager.setTheme(name);
    }
};
</script>
```

### 4. Angular z serwisem

```typescript
// theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private themeManager: any;
    private currentThemeSubject = new BehaviorSubject<string>('');
    
    currentTheme$ = this.currentThemeSubject.asObservable();
    
    constructor() {
        this.initThemeManager();
    }
    
    private initThemeManager() {
        this.themeManager = new (window as any).ExcalidrawThemeManager();
        
        this.themeManager.on('onThemeChange', (theme: string) => {
            this.currentThemeSubject.next(theme);
        });
    }
    
    setTheme(name: string) {
        this.themeManager?.setTheme(name);
    }
    
    getAvailableThemes() {
        return this.themeManager?.getAvailableThemes() || {};
    }
}

// app.component.ts
import { Component } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
    selector: 'app-root',
    template: `
        <div class="app">
            <div class="theme-controls">
                <button 
                    *ngFor="let theme of themeEntries" 
                    (click)="setTheme(theme.key)"
                    [class.active]="theme.value === (currentTheme$ | async)"
                >
                    {{ theme.key }}
                </button>
            </div>
            
            <div 
                class="excalidraw-theme-wrapper" 
                [class]="currentTheme$ | async"
            >
                <!-- Excalidraw component -->
            </div>
        </div>
    `
})
export class AppComponent {
    currentTheme$ = this.themeService.currentTheme$;
    themeEntries = Object.entries(this.themeService.getAvailableThemes())
        .map(([key, value]) => ({ key, value }));
    
    constructor(private themeService: ThemeService) {}
    
    setTheme(name: string) {
        this.themeService.setTheme(name);
    }
}
```

## 🐛 Rozwiązywanie problemów

### Częste problemy

#### 1. Theme nie są stosowane

**Problem:** Klasy CSS nie są stosowane do elementów Excalidraw.

**Rozwiązanie:**
```javascript
// Sprawdź czy kontener ma odpowiednią klasę
const container = document.querySelector('.excalidraw-theme-wrapper');
if (!container) {
    console.error('Kontener .excalidraw-theme-wrapper nie został znaleziony');
}

// Sprawdź czy style są załadowane
const styles = getComputedStyle(container);
console.log('Primary color:', styles.getPropertyValue('--color-primary'));
```

#### 2. ExcalidrawThemeManager nie jest zdefiniowany

**Problem:** `ExcalidrawThemeManager is not defined`

**Rozwiązanie:**
```html
<!-- Upewnij się, że theme-wrapper.js jest załadowany -->
<script src="theme-wrapper.js"></script>
<script>
    // Sprawdź dostępność
    if (typeof ExcalidrawThemeManager === 'undefined') {
        console.error('ExcalidrawThemeManager nie jest dostępny');
    } else {
        const themeManager = new ExcalidrawThemeManager();
    }
</script>
```

#### 3. Theme nie są zapisywane

**Problem:** Theme nie są zapisywane w localStorage.

**Rozwiązanie:**
```javascript
// Sprawdź czy localStorage jest dostępny
if (typeof Storage !== 'undefined') {
    const themeManager = new ExcalidrawThemeManager({
        autoSave: true,
        storageKey: 'my-theme-key'
    });
} else {
    console.warn('localStorage nie jest dostępny');
}
```

#### 4. Problemy z responsywnością

**Problem:** Theme nie działają poprawnie na urządzeniach mobilnych.

**Rozwiązanie:**
```scss
// Dodaj media queries
.excalidraw-theme-wrapper {
    @media (max-width: 768px) {
        // Style mobilne
        --island-bg-color: #ffffff;
        
        .excalidraw .App-toolbar {
            padding: 0.5rem;
            font-size: 0.9rem;
        }
    }
}
```

#### 5. Konflikty z innymi stylami

**Problem:** Theme kolidują z innymi stylami CSS.

**Rozwiązanie:**
```scss
// Zwiększ specyficzność
.excalidraw-theme-wrapper.theme-blue {
    .excalidraw {
        // Twoje style z wyższą specyficznością
        --color-primary: #007bff !important;
    }
}
```

### Debug mode

```javascript
// Włącz tryb debug
const themeManager = new ExcalidrawThemeManager({
    debug: true // Dodaj tę opcję do konstruktora
});

// Sprawdź stan theme managera
console.log('Current theme:', themeManager.getCurrentTheme());
console.log('Available themes:', themeManager.getAvailableThemes());
console.log('CSS variables:', themeManager.getCSSVariables());
```

### Testowanie

```javascript
// Test wszystkich theme
const testAllThemes = () => {
    const themes = Object.keys(themeManager.getAvailableThemes());
    let index = 0;
    
    const testNext = () => {
        if (index < themes.length) {
            console.log(`Testing theme: ${themes[index]}`);
            themeManager.setTheme(themes[index]);
            index++;
            setTimeout(testNext, 2000);
        }
    };
    
    testNext();
};

// Uruchom test
testAllThemes();
```

## 🤝 Wkład w rozwój

### Jak dodać nowy theme

1. **Dodaj style SCSS:**

```scss
// W theme-wrapper.scss
.excalidraw-theme-wrapper.theme-my-new-theme {
    // Zmienne CSS
    --color-primary: #your-color;
    --default-bg-color: #your-bg;
    
    // Niestandardowe style
    .excalidraw .App-toolbar {
        background: linear-gradient(45deg, #color1, #color2);
    }
}
```

2. **Zarejestruj w JavaScript:**

```javascript
// W theme-wrapper.js, dodaj do obiektu themes
themes: {
    // ... istniejące theme
    'my-new-theme': 'theme-my-new-theme'
}
```

3. **Dodaj dokumentację:**

```markdown
| **My New Theme** | `theme-my-new-theme` | Opis nowego theme |
```

### Zgłaszanie błędów

Podczas zgłaszania błędów, dołącz:

- Wersję przeglądarki
- Kod reprodukujący błąd
- Oczekiwane vs rzeczywiste zachowanie
- Zrzuty ekranu (jeśli dotyczy)

### Propozycje ulepszeń

Chętnie przyjmujemy propozycje:

- Nowych theme
- Ulepszeń wydajności
- Dodatkowych funkcji
- Poprawek dokumentacji

## 📄 Licencja

Ten projekt jest dostępny na licencji MIT. Zobacz plik LICENSE dla szczegółów.

## 🙏 Podziękowania

- Zespół Excalidraw za stworzenie wspaniałego narzędzia
- Społeczność open source za inspirację
- Wszystkim kontrybutorów za wkład w rozwój

---

**Stworzone z ❤️ dla społeczności Excalidraw**

*Ostatnia aktualizacja: 2024*