/**
 * EXCALIDRAW THEME WRAPPER - React Integration Example
 * 
 * Ten plik pokazuje jak zintegrować theme wrapper z aplikacją React
 * i jak stworzyć komponenty do zarządzania theme.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';

// Import theme wrapper (zakładając, że jest dostępny)
// import { ExcalidrawThemeManager } from './theme-wrapper.js';

/**
 * Hook do zarządzania theme Excalidraw
 */
function useExcalidrawTheme(options = {}) {
    const [themeManager, setThemeManager] = useState(null);
    const [currentTheme, setCurrentTheme] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        // Inicjalizuj theme manager
        const manager = new ExcalidrawThemeManager({
            containerSelector: '.excalidraw-theme-wrapper',
            storageKey: 'excalidraw-react-theme',
            defaultTheme: options.defaultTheme || '',
            autoSave: options.autoSave !== false,
            ...options
        });
        
        // Callback dla zmiany theme
        const handleThemeChange = (newTheme) => {
            setCurrentTheme(newTheme);
        };
        
        const handleThemeLoad = (theme) => {
            setCurrentTheme(theme);
            setIsLoading(false);
        };
        
        manager.on('onThemeChange', handleThemeChange);
        manager.on('onThemeLoad', handleThemeLoad);
        
        setThemeManager(manager);
        
        // Cleanup
        return () => {
            manager.off('onThemeChange', handleThemeChange);
            manager.off('onThemeLoad', handleThemeLoad);
        };
    }, []);
    
    const setTheme = useCallback((theme) => {
        if (themeManager) {
            themeManager.setTheme(theme);
        }
    }, [themeManager]);
    
    const nextTheme = useCallback(() => {
        if (themeManager) {
            themeManager.nextTheme();
        }
    }, [themeManager]);
    
    const previousTheme = useCallback(() => {
        if (themeManager) {
            themeManager.previousTheme();
        }
    }, [themeManager]);
    
    const randomTheme = useCallback(() => {
        if (themeManager) {
            themeManager.randomTheme();
        }
    }, [themeManager]);
    
    return {
        themeManager,
        currentTheme,
        isLoading,
        setTheme,
        nextTheme,
        previousTheme,
        randomTheme,
        availableThemes: themeManager ? themeManager.getAvailableThemes() : {}
    };
}

/**
 * Komponent selektora theme
 */
function ThemeSelector({ themeManager, currentTheme, className = '' }) {
    const availableThemes = themeManager ? themeManager.getAvailableThemes() : {};
    
    const handleThemeChange = (event) => {
        if (themeManager) {
            themeManager.setTheme(event.target.value);
        }
    };
    
    return (
        <div className={`theme-selector ${className}`}>
            <label htmlFor="theme-select">Wybierz theme:</label>
            <select 
                id="theme-select"
                value={Object.keys(availableThemes).find(key => availableThemes[key] === currentTheme) || 'default'}
                onChange={handleThemeChange}
                className="theme-select"
            >
                {Object.entries(availableThemes).map(([name, className]) => (
                    <option key={name} value={name}>
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * Komponent przycisków theme
 */
function ThemeButtons({ themeManager, currentTheme, className = '' }) {
    const availableThemes = themeManager ? themeManager.getAvailableThemes() : {};
    
    const handleThemeClick = (themeName) => {
        if (themeManager) {
            themeManager.setTheme(themeName);
        }
    };
    
    return (
        <div className={`theme-buttons ${className}`}>
            {Object.entries(availableThemes).map(([name, themeClass]) => (
                <button
                    key={name}
                    onClick={() => handleThemeClick(name)}
                    className={`theme-button ${
                        themeClass === currentTheme ? 'active' : ''
                    }`}
                    data-theme={name}
                >
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                </button>
            ))}
        </div>
    );
}

/**
 * Komponent panelu kontrolnego theme
 */
function ThemeControlPanel({ themeManager, currentTheme, className = '' }) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [customColor, setCustomColor] = useState('#6965db');
    
    const handleRandomTheme = () => {
        if (themeManager) {
            themeManager.randomTheme();
        }
    };
    
    const handleNextTheme = () => {
        if (themeManager) {
            themeManager.nextTheme();
        }
    };
    
    const handlePreviousTheme = () => {
        if (themeManager) {
            themeManager.previousTheme();
        }
    };
    
    const handleCustomColorChange = (color) => {
        setCustomColor(color);
        if (themeManager) {
            themeManager.setCSSVariable('--color-primary', color);
            themeManager.setCSSVariable('--color-primary-darker', color + '99');
        }
    };
    
    const handleResetColors = () => {
        if (themeManager) {
            themeManager.resetCSSVariables();
        }
    };
    
    const handleExportConfig = () => {
        if (themeManager) {
            const config = themeManager.exportConfig();
            const blob = new Blob([JSON.stringify(config, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'excalidraw-theme-config.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    };
    
    const handleImportConfig = (event) => {
        const file = event.target.files[0];
        if (file && themeManager) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    themeManager.importConfig(config);
                } catch (error) {
                    console.error('Błąd importu konfiguracji:', error);
                    alert('Błąd importu konfiguracji theme');
                }
            };
            reader.readAsText(file);
        }
    };
    
    return (
        <div className={`theme-control-panel ${className}`}>
            <div className="theme-controls-basic">
                <h3>Kontrola Theme</h3>
                
                <div className="theme-navigation">
                    <button onClick={handlePreviousTheme} title="Poprzedni theme">
                        ← Poprzedni
                    </button>
                    <button onClick={handleNextTheme} title="Następny theme">
                        Następny →
                    </button>
                    <button onClick={handleRandomTheme} title="Losowy theme">
                        🎲 Losowy
                    </button>
                </div>
                
                <div className="current-theme-info">
                    <strong>Aktualny theme:</strong> 
                    <span className="current-theme-name">
                        {Object.keys(themeManager?.getAvailableThemes() || {}).find(
                            key => themeManager?.getAvailableThemes()[key] === currentTheme
                        ) || 'Default'}
                    </span>
                </div>
            </div>
            
            <div className="theme-controls-advanced">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="toggle-advanced"
                >
                    {showAdvanced ? '▼' : '▶'} Zaawansowane opcje
                </button>
                
                {showAdvanced && (
                    <div className="advanced-options">
                        <div className="custom-color-picker">
                            <label htmlFor="custom-color">Niestandardowy kolor główny:</label>
                            <input
                                id="custom-color"
                                type="color"
                                value={customColor}
                                onChange={(e) => handleCustomColorChange(e.target.value)}
                            />
                            <button onClick={handleResetColors}>
                                Resetuj kolory
                            </button>
                        </div>
                        
                        <div className="config-management">
                            <button onClick={handleExportConfig}>
                                📥 Eksportuj konfigurację
                            </button>
                            <label className="import-config">
                                📤 Importuj konfigurację
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportConfig}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        
                        <div className="keyboard-shortcuts">
                            <h4>Skróty klawiszowe:</h4>
                            <ul>
                                <li><kbd>Ctrl+Shift+T</kbd> - Następny theme</li>
                                <li><kbd>Ctrl+Shift+R</kbd> - Losowy theme</li>
                                <li><kbd>Ctrl+Shift+1-8</kbd> - Konkretny theme</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Główny komponent Excalidraw z theme wrapper
 */
function ExcalidrawWithTheme({ 
    initialData = null,
    onChange = () => {},
    themeOptions = {},
    showThemeControls = true,
    className = ''
}) {
    const {
        themeManager,
        currentTheme,
        isLoading,
        setTheme,
        nextTheme,
        previousTheme,
        randomTheme,
        availableThemes
    } = useExcalidrawTheme(themeOptions);
    
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);
    
    // Obsługa skrótów klawiszowych
    useEffect(() => {
        if (themeManager) {
            const handleKeyDown = (e) => {
                // Ctrl+Shift+T - następny theme
                if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                    e.preventDefault();
                    nextTheme();
                }
                
                // Ctrl+Shift+R - losowy theme
                if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                    e.preventDefault();
                    randomTheme();
                }
                
                // Ctrl+Shift+1-8 - konkretne theme
                if (e.ctrlKey && e.shiftKey && e.key >= '1' && e.key <= '8') {
                    e.preventDefault();
                    const themeNames = Object.keys(availableThemes);
                    const index = parseInt(e.key) - 1;
                    if (themeNames[index]) {
                        setTheme(themeNames[index]);
                    }
                }
            };
            
            document.addEventListener('keydown', handleKeyDown);
            
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [themeManager, nextTheme, randomTheme, setTheme, availableThemes]);
    
    if (isLoading) {
        return (
            <div className="excalidraw-loading">
                <div className="loading-spinner">Ładowanie theme...</div>
            </div>
        );
    }
    
    return (
        <div className={`excalidraw-theme-wrapper ${currentTheme} ${className}`}>
            {showThemeControls && (
                <div className="theme-controls-container">
                    <ThemeSelector 
                        themeManager={themeManager}
                        currentTheme={currentTheme}
                        className="theme-selector-compact"
                    />
                    
                    <ThemeButtons 
                        themeManager={themeManager}
                        currentTheme={currentTheme}
                        className="theme-buttons-compact"
                    />
                    
                    <ThemeControlPanel 
                        themeManager={themeManager}
                        currentTheme={currentTheme}
                        className="theme-panel-compact"
                    />
                </div>
            )}
            
            <div className="excalidraw-container">
                <Excalidraw
                    ref={(api) => setExcalidrawAPI(api)}
                    initialData={initialData}
                    onChange={onChange}
                    theme={currentTheme.includes('dark') ? 'dark' : 'light'}
                />
            </div>
        </div>
    );
}

/**
 * Przykład użycia w aplikacji
 */
function App() {
    const [excalidrawData, setExcalidrawData] = useState(null);
    
    const handleExcalidrawChange = (elements, appState) => {
        setExcalidrawData({ elements, appState });
    };
    
    return (
        <div className="app">
            <header className="app-header">
                <h1>Excalidraw z Theme Wrapper</h1>
                <p>Przykład integracji z React</p>
            </header>
            
            <main className="app-main">
                <ExcalidrawWithTheme
                    initialData={excalidrawData}
                    onChange={handleExcalidrawChange}
                    themeOptions={{
                        defaultTheme: 'blue',
                        autoSave: true
                    }}
                    showThemeControls={true}
                    className="app-excalidraw"
                />
            </main>
            
            <footer className="app-footer">
                <p>Użyj skrótów klawiszowych lub kontrolek powyżej aby zmienić theme</p>
            </footer>
        </div>
    );
}

/**
 * Komponent wyższego rzędu (HOC) dla theme
 */
function withExcalidrawTheme(WrappedComponent, themeOptions = {}) {
    return function ThemedComponent(props) {
        const themeProps = useExcalidrawTheme(themeOptions);
        
        return (
            <div className={`excalidraw-theme-wrapper ${themeProps.currentTheme}`}>
                <WrappedComponent {...props} {...themeProps} />
            </div>
        );
    };
}

/**
 * Context dla theme (dla bardziej zaawansowanych przypadków)
 */
const ExcalidrawThemeContext = React.createContext(null);

function ExcalidrawThemeProvider({ children, themeOptions = {} }) {
    const themeProps = useExcalidrawTheme(themeOptions);
    
    return (
        <ExcalidrawThemeContext.Provider value={themeProps}>
            <div className={`excalidraw-theme-wrapper ${themeProps.currentTheme}`}>
                {children}
            </div>
        </ExcalidrawThemeContext.Provider>
    );
}

function useExcalidrawThemeContext() {
    const context = React.useContext(ExcalidrawThemeContext);
    if (!context) {
        throw new Error('useExcalidrawThemeContext must be used within ExcalidrawThemeProvider');
    }
    return context;
}

// Eksport komponentów
export {
    useExcalidrawTheme,
    ThemeSelector,
    ThemeButtons,
    ThemeControlPanel,
    ExcalidrawWithTheme,
    withExcalidrawTheme,
    ExcalidrawThemeProvider,
    useExcalidrawThemeContext,
    App as ExampleApp
};

export default ExcalidrawWithTheme;

/**
 * Przykłady użycia:
 * 
 * 1. Podstawowe użycie:
 * <ExcalidrawWithTheme />
 * 
 * 2. Z niestandardowymi opcjami:
 * <ExcalidrawWithTheme 
 *   themeOptions={{ defaultTheme: 'blue' }}
 *   showThemeControls={true}
 * />
 * 
 * 3. Z Context API:
 * <ExcalidrawThemeProvider themeOptions={{ defaultTheme: 'green' }}>
 *   <YourComponent />
 * </ExcalidrawThemeProvider>
 * 
 * 4. Z HOC:
 * const ThemedExcalidraw = withExcalidrawTheme(YourExcalidrawComponent);
 * 
 * 5. Z hookiem:
 * function YourComponent() {
 *   const { setTheme, currentTheme } = useExcalidrawTheme();
 *   // ...
 * }
 */