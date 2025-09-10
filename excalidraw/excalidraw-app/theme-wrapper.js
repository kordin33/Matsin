/**
 * EXCALIDRAW THEME WRAPPER - JavaScript Helper
 * 
 * Ten plik zawiera pomocnicze funkcje JavaScript do zarządzania theme
 * w aplikacjach Excalidraw bez modyfikacji kodu źródłowego.
 * 
 * @version 1.0.0
 * @author Excalidraw Theme Wrapper
 */

/**
 * Klasa do zarządzania theme Excalidraw
 */
class ExcalidrawThemeManager {
    constructor(options = {}) {
        this.containerSelector = options.containerSelector || '.excalidraw-theme-wrapper';
        this.storageKey = options.storageKey || 'excalidraw-theme';
        this.defaultTheme = options.defaultTheme || '';
        this.autoSave = options.autoSave !== false;
        
        this.themes = {
            default: '',
            blue: 'theme-blue',
            green: 'theme-green',
            purple: 'theme-purple',
            orange: 'theme-orange',
            glass: 'theme-glass',
            neon: 'theme-neon',
            minimal: 'theme-minimal'
        };
        
        this.currentTheme = this.defaultTheme;
        this.callbacks = {
            onThemeChange: [],
            onThemeLoad: []
        };
        
        this.init();
    }
    
    /**
     * Inicjalizacja theme managera
     */
    init() {
        // Wczytaj zapisany theme
        if (this.autoSave) {
            this.currentTheme = this.loadTheme();
        }
        
        // Zastosuj theme
        this.applyTheme(this.currentTheme);
        
        // Wywołaj callback
        this.triggerCallback('onThemeLoad', this.currentTheme);
        
        // Nasłuchuj zmiany trybu ciemnego
        this.watchDarkMode();
    }
    
    /**
     * Zmień theme
     * @param {string} themeName - Nazwa theme
     */
    setTheme(themeName) {
        const themeClass = this.themes[themeName] || themeName || '';
        
        if (themeClass !== this.currentTheme) {
            this.currentTheme = themeClass;
            this.applyTheme(themeClass);
            
            if (this.autoSave) {
                this.saveTheme(themeClass);
            }
            
            this.triggerCallback('onThemeChange', themeClass);
        }
    }
    
    /**
     * Pobierz aktualny theme
     * @returns {string} Aktualny theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Pobierz listę dostępnych theme
     * @returns {Object} Lista theme
     */
    getAvailableThemes() {
        return { ...this.themes };
    }
    
    /**
     * Zastosuj theme do kontenera
     * @param {string} themeClass - Klasa CSS theme
     */
    applyTheme(themeClass) {
        const containers = document.querySelectorAll(this.containerSelector);
        
        containers.forEach(container => {
            // Usuń wszystkie klasy theme
            Object.values(this.themes).forEach(theme => {
                if (theme) container.classList.remove(theme);
            });
            
            // Dodaj nową klasę theme
            if (themeClass) {
                container.classList.add(themeClass);
            }
        });
    }
    
    /**
     * Zapisz theme w localStorage
     * @param {string} theme - Theme do zapisania
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (e) {
            console.warn('Nie można zapisać theme w localStorage:', e);
        }
    }
    
    /**
     * Wczytaj theme z localStorage
     * @returns {string} Zapisany theme
     */
    loadTheme() {
        try {
            return localStorage.getItem(this.storageKey) || this.defaultTheme;
        } catch (e) {
            console.warn('Nie można wczytać theme z localStorage:', e);
            return this.defaultTheme;
        }
    }
    
    /**
     * Przełącz na następny theme
     */
    nextTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.findIndex(name => this.themes[name] === this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        const nextTheme = themeNames[nextIndex];
        
        this.setTheme(nextTheme);
    }
    
    /**
     * Przełącz na poprzedni theme
     */
    previousTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.findIndex(name => this.themes[name] === this.currentTheme);
        const prevIndex = currentIndex <= 0 ? themeNames.length - 1 : currentIndex - 1;
        const prevTheme = themeNames[prevIndex];
        
        this.setTheme(prevTheme);
    }
    
    /**
     * Przełącz theme losowo
     */
    randomTheme() {
        const themeNames = Object.keys(this.themes);
        const randomIndex = Math.floor(Math.random() * themeNames.length);
        const randomTheme = themeNames[randomIndex];
        
        this.setTheme(randomTheme);
    }
    
    /**
     * Dodaj nowy theme
     * @param {string} name - Nazwa theme
     * @param {string} className - Klasa CSS theme
     */
    addTheme(name, className) {
        this.themes[name] = className;
    }
    
    /**
     * Usuń theme
     * @param {string} name - Nazwa theme do usunięcia
     */
    removeTheme(name) {
        if (this.themes[name]) {
            delete this.themes[name];
        }
    }
    
    /**
     * Dodaj callback
     * @param {string} event - Nazwa eventu (onThemeChange, onThemeLoad)
     * @param {Function} callback - Funkcja callback
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    /**
     * Usuń callback
     * @param {string} event - Nazwa eventu
     * @param {Function} callback - Funkcja callback do usunięcia
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }
    
    /**
     * Wywołaj callback
     * @param {string} event - Nazwa eventu
     * @param {*} data - Dane do przekazania
     */
    triggerCallback(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Błąd w callback:', e);
                }
            });
        }
    }
    
    /**
     * Nasłuchuj zmiany trybu ciemnego
     */
    watchDarkMode() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleDarkModeChange = (e) => {
                // Można dodać logikę automatycznego przełączania theme
                // na podstawie preferencji systemowych
                this.triggerCallback('onDarkModeChange', e.matches);
            };
            
            darkModeQuery.addListener(handleDarkModeChange);
            
            // Wywołaj od razu dla aktualnego stanu
            handleDarkModeChange(darkModeQuery);
        }
    }
    
    /**
     * Pobierz zmienne CSS dla aktualnego theme
     * @returns {Object} Obiekt ze zmiennymi CSS
     */
    getCSSVariables() {
        const excalidrawElement = document.querySelector('.excalidraw');
        if (!excalidrawElement) return {};
        
        const styles = getComputedStyle(excalidrawElement);
        const variables = {};
        
        // Lista głównych zmiennych CSS
        const cssVars = [
            '--color-primary',
            '--color-primary-darker',
            '--color-primary-darkest',
            '--color-primary-light',
            '--default-bg-color',
            '--island-bg-color',
            '--text-primary-color',
            '--button-hover-bg',
            '--default-border-color'
        ];
        
        cssVars.forEach(varName => {
            variables[varName] = styles.getPropertyValue(varName).trim();
        });
        
        return variables;
    }
    
    /**
     * Ustaw zmienną CSS
     * @param {string} varName - Nazwa zmiennej CSS
     * @param {string} value - Wartość zmiennej
     */
    setCSSVariable(varName, value) {
        const containers = document.querySelectorAll(this.containerSelector);
        
        containers.forEach(container => {
            container.style.setProperty(varName, value);
        });
    }
    
    /**
     * Resetuj wszystkie niestandardowe zmienne CSS
     */
    resetCSSVariables() {
        const containers = document.querySelectorAll(this.containerSelector);
        
        containers.forEach(container => {
            // Usuń wszystkie niestandardowe właściwości CSS
            const style = container.style;
            for (let i = style.length - 1; i >= 0; i--) {
                const prop = style[i];
                if (prop.startsWith('--')) {
                    style.removeProperty(prop);
                }
            }
        });
    }
    
    /**
     * Eksportuj konfigurację theme
     * @returns {Object} Konfiguracja theme
     */
    exportConfig() {
        return {
            currentTheme: this.currentTheme,
            themes: this.themes,
            cssVariables: this.getCSSVariables()
        };
    }
    
    /**
     * Importuj konfigurację theme
     * @param {Object} config - Konfiguracja do importu
     */
    importConfig(config) {
        if (config.themes) {
            this.themes = { ...this.themes, ...config.themes };
        }
        
        if (config.currentTheme) {
            this.setTheme(config.currentTheme);
        }
        
        if (config.cssVariables) {
            Object.entries(config.cssVariables).forEach(([varName, value]) => {
                this.setCSSVariable(varName, value);
            });
        }
    }
}

/**
 * Funkcje pomocnicze dla szybkiej integracji
 */

/**
 * Stwórz prosty selektor theme
 * @param {HTMLElement} container - Kontener dla selektora
 * @param {ExcalidrawThemeManager} themeManager - Instance theme managera
 */
function createThemeSelector(container, themeManager) {
    const selector = document.createElement('select');
    selector.className = 'excalidraw-theme-selector';
    
    // Dodaj opcje
    Object.entries(themeManager.getAvailableThemes()).forEach(([name, className]) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        option.selected = className === themeManager.getCurrentTheme();
        selector.appendChild(option);
    });
    
    // Obsługa zmiany
    selector.addEventListener('change', (e) => {
        themeManager.setTheme(e.target.value);
    });
    
    // Aktualizuj selektor przy zmianie theme
    themeManager.on('onThemeChange', (newTheme) => {
        const themeName = Object.keys(themeManager.themes).find(
            key => themeManager.themes[key] === newTheme
        ) || 'default';
        selector.value = themeName;
    });
    
    container.appendChild(selector);
    return selector;
}

/**
 * Stwórz przyciski theme
 * @param {HTMLElement} container - Kontener dla przycisków
 * @param {ExcalidrawThemeManager} themeManager - Instance theme managera
 */
function createThemeButtons(container, themeManager) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'excalidraw-theme-buttons';
    
    Object.entries(themeManager.getAvailableThemes()).forEach(([name, className]) => {
        const button = document.createElement('button');
        button.className = 'excalidraw-theme-button';
        button.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        button.dataset.theme = name;
        
        // Oznacz aktywny przycisk
        if (className === themeManager.getCurrentTheme()) {
            button.classList.add('active');
        }
        
        // Obsługa kliknięcia
        button.addEventListener('click', () => {
            themeManager.setTheme(name);
        });
        
        buttonsContainer.appendChild(button);
    });
    
    // Aktualizuj przyciski przy zmianie theme
    themeManager.on('onThemeChange', (newTheme) => {
        buttonsContainer.querySelectorAll('.excalidraw-theme-button').forEach(btn => {
            btn.classList.remove('active');
            const themeName = Object.keys(themeManager.themes).find(
                key => themeManager.themes[key] === newTheme
            ) || 'default';
            if (btn.dataset.theme === themeName) {
                btn.classList.add('active');
            }
        });
    });
    
    container.appendChild(buttonsContainer);
    return buttonsContainer;
}

/**
 * Dodaj skróty klawiszowe dla theme
 * @param {ExcalidrawThemeManager} themeManager - Instance theme managera
 */
function addThemeKeyboardShortcuts(themeManager) {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+T - następny theme
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            themeManager.nextTheme();
        }
        
        // Ctrl+Shift+R - losowy theme
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            themeManager.randomTheme();
        }
        
        // Ctrl+Shift+1-8 - konkretne theme
        if (e.ctrlKey && e.shiftKey && e.key >= '1' && e.key <= '8') {
            e.preventDefault();
            const themeNames = Object.keys(themeManager.getAvailableThemes());
            const index = parseInt(e.key) - 1;
            if (themeNames[index]) {
                themeManager.setTheme(themeNames[index]);
            }
        }
    });
}

/**
 * Integracja z React
 */
function createReactThemeHook(themeManager) {
    if (typeof React === 'undefined') {
        console.warn('React nie jest dostępny');
        return null;
    }
    
    return function useExcalidrawTheme() {
        const [currentTheme, setCurrentTheme] = React.useState(themeManager.getCurrentTheme());
        
        React.useEffect(() => {
            const handleThemeChange = (newTheme) => {
                setCurrentTheme(newTheme);
            };
            
            themeManager.on('onThemeChange', handleThemeChange);
            
            return () => {
                themeManager.off('onThemeChange', handleThemeChange);
            };
        }, []);
        
        return {
            currentTheme,
            setTheme: (theme) => themeManager.setTheme(theme),
            availableThemes: themeManager.getAvailableThemes(),
            nextTheme: () => themeManager.nextTheme(),
            previousTheme: () => themeManager.previousTheme(),
            randomTheme: () => themeManager.randomTheme()
        };
    };
}

// Eksport dla różnych środowisk
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = {
        ExcalidrawThemeManager,
        createThemeSelector,
        createThemeButtons,
        addThemeKeyboardShortcuts,
        createReactThemeHook
    };
} else if (typeof window !== 'undefined') {
    // Browser
    window.ExcalidrawThemeManager = ExcalidrawThemeManager;
    window.createThemeSelector = createThemeSelector;
    window.createThemeButtons = createThemeButtons;
    window.addThemeKeyboardShortcuts = addThemeKeyboardShortcuts;
    window.createReactThemeHook = createReactThemeHook;
}

// Przykład użycia
if (typeof window !== 'undefined') {
    // Automatyczna inicjalizacja po załadowaniu DOM
    document.addEventListener('DOMContentLoaded', () => {
        // Sprawdź czy istnieje kontener theme wrapper
        if (document.querySelector('.excalidraw-theme-wrapper')) {
            console.log('🎨 Excalidraw Theme Wrapper wykryty!');
            console.log('💡 Użyj: new ExcalidrawThemeManager() aby rozpocząć');
        }
    });
}