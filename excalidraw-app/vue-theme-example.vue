<template>
  <!-- EXCALIDRAW THEME WRAPPER - Vue.js Integration Example -->
  <div class="excalidraw-vue-app">
    <header class="app-header">
      <h1>Excalidraw z Theme Wrapper - Vue.js</h1>
      <p>Przykład integracji z Vue.js</p>
    </header>
    
    <!-- Kontrolki theme -->
    <div v-if="showThemeControls" class="theme-controls-container">
      <!-- Selektor theme -->
      <div class="theme-selector">
        <label for="theme-select">Wybierz theme:</label>
        <select 
          id="theme-select"
          v-model="selectedTheme"
          @change="handleThemeChange"
          class="theme-select"
        >
          <option 
            v-for="(className, name) in availableThemes" 
            :key="name" 
            :value="name"
          >
            {{ capitalizeFirst(name) }}
          </option>
        </select>
      </div>
      
      <!-- Przyciski theme -->
      <div class="theme-buttons">
        <button
          v-for="(className, name) in availableThemes"
          :key="name"
          @click="setTheme(name)"
          :class="['theme-button', { active: className === currentTheme }]"
          :data-theme="name"
        >
          {{ capitalizeFirst(name) }}
        </button>
      </div>
      
      <!-- Panel kontrolny -->
      <div class="theme-control-panel">
        <div class="theme-navigation">
          <button @click="previousTheme" title="Poprzedni theme">
            ← Poprzedni
          </button>
          <button @click="nextTheme" title="Następny theme">
            Następny →
          </button>
          <button @click="randomTheme" title="Losowy theme">
            🎲 Losowy
          </button>
        </div>
        
        <div class="current-theme-info">
          <strong>Aktualny theme:</strong> 
          <span class="current-theme-name">{{ currentThemeName }}</span>
        </div>
        
        <!-- Zaawansowane opcje -->
        <div class="advanced-options">
          <button 
            @click="showAdvanced = !showAdvanced"
            class="toggle-advanced"
          >
            {{ showAdvanced ? '▼' : '▶' }} Zaawansowane opcje
          </button>
          
          <div v-if="showAdvanced" class="advanced-content">
            <div class="custom-color-picker">
              <label for="custom-color">Niestandardowy kolor główny:</label>
              <input
                id="custom-color"
                type="color"
                v-model="customColor"
                @input="handleCustomColorChange"
              />
              <button @click="resetColors">Resetuj kolory</button>
            </div>
            
            <div class="config-management">
              <button @click="exportConfig">📥 Eksportuj konfigurację</button>
              <label class="import-config">
                📤 Importuj konfigurację
                <input
                  type="file"
                  accept=".json"
                  @change="importConfig"
                  style="display: none"
                  ref="fileInput"
                />
              </label>
            </div>
            
            <div class="keyboard-shortcuts">
              <h4>Skróty klawiszowe:</h4>
              <ul>
                <li><kbd>Ctrl+Shift+T</kbd> - Następny theme</li>
                <li><kbd>Ctrl+Shift+R</kbd> - Losowy theme</li>
                <li><kbd>Ctrl+Shift+1-8</kbd> - Konkretny theme</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Kontener Excalidraw -->
    <div 
      :class="['excalidraw-theme-wrapper', currentTheme]"
      ref="excalidrawContainer"
    >
      <div v-if="isLoading" class="excalidraw-loading">
        <div class="loading-spinner">Ładowanie theme...</div>
      </div>
      
      <div v-else class="excalidraw-container">
        <!-- Tutaj będzie renderowany Excalidraw -->
        <div id="excalidraw-app" ref="excalidrawApp"></div>
      </div>
    </div>
    
    <footer class="app-footer">
      <p>Użyj skrótów klawiszowych lub kontrolek powyżej aby zmienić theme</p>
    </footer>
  </div>
</template>

<script>
// Import theme wrapper (zakładając, że jest dostępny)
// import { ExcalidrawThemeManager } from './theme-wrapper.js';

export default {
  name: 'ExcalidrawVueTheme',
  
  props: {
    initialData: {
      type: Object,
      default: null
    },
    themeOptions: {
      type: Object,
      default: () => ({})
    },
    showThemeControls: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      themeManager: null,
      currentTheme: '',
      selectedTheme: 'default',
      availableThemes: {},
      isLoading: true,
      showAdvanced: false,
      customColor: '#6965db',
      excalidrawAPI: null
    };
  },
  
  computed: {
    currentThemeName() {
      const themeName = Object.keys(this.availableThemes).find(
        key => this.availableThemes[key] === this.currentTheme
      );
      return this.capitalizeFirst(themeName || 'default');
    }
  },
  
  mounted() {
    this.initializeThemeManager();
    this.setupKeyboardShortcuts();
    this.initializeExcalidraw();
  },
  
  beforeUnmount() {
    this.cleanup();
  },
  
  methods: {
    /**
     * Inicjalizacja theme managera
     */
    initializeThemeManager() {
      // Sprawdź czy ExcalidrawThemeManager jest dostępny
      if (typeof ExcalidrawThemeManager === 'undefined') {
        console.error('ExcalidrawThemeManager nie jest dostępny. Upewnij się, że theme-wrapper.js jest załadowany.');
        this.isLoading = false;
        return;
      }
      
      const options = {
        containerSelector: '.excalidraw-theme-wrapper',
        storageKey: 'excalidraw-vue-theme',
        defaultTheme: '',
        autoSave: true,
        ...this.themeOptions
      };
      
      this.themeManager = new ExcalidrawThemeManager(options);
      
      // Callback dla zmiany theme
      this.themeManager.on('onThemeChange', this.handleThemeManagerChange);
      this.themeManager.on('onThemeLoad', this.handleThemeManagerLoad);
      
      // Pobierz dostępne theme
      this.availableThemes = this.themeManager.getAvailableThemes();
    },
    
    /**
     * Inicjalizacja Excalidraw
     */
    async initializeExcalidraw() {
      try {
        // Tutaj można zainicjalizować Excalidraw
        // const { Excalidraw } = await import('@excalidraw/excalidraw');
        // Implementacja zależy od sposobu importu Excalidraw w Vue
        
        console.log('Excalidraw zostanie zainicjalizowany tutaj');
        
        // Symulacja ładowania
        setTimeout(() => {
          if (this.isLoading) {
            this.isLoading = false;
          }
        }, 1000);
        
      } catch (error) {
        console.error('Błąd inicjalizacji Excalidraw:', error);
        this.isLoading = false;
      }
    },
    
    /**
     * Obsługa zmiany theme z managera
     */
    handleThemeManagerChange(newTheme) {
      this.currentTheme = newTheme;
      this.selectedTheme = Object.keys(this.availableThemes).find(
        key => this.availableThemes[key] === newTheme
      ) || 'default';
      
      this.$emit('theme-changed', newTheme);
    },
    
    /**
     * Obsługa załadowania theme
     */
    handleThemeManagerLoad(theme) {
      this.currentTheme = theme;
      this.selectedTheme = Object.keys(this.availableThemes).find(
        key => this.availableThemes[key] === theme
      ) || 'default';
      
      if (this.isLoading) {
        this.isLoading = false;
      }
      
      this.$emit('theme-loaded', theme);
    },
    
    /**
     * Obsługa zmiany theme z selektora
     */
    handleThemeChange() {
      if (this.themeManager) {
        this.themeManager.setTheme(this.selectedTheme);
      }
    },
    
    /**
     * Ustaw theme
     */
    setTheme(themeName) {
      if (this.themeManager) {
        this.themeManager.setTheme(themeName);
      }
    },
    
    /**
     * Następny theme
     */
    nextTheme() {
      if (this.themeManager) {
        this.themeManager.nextTheme();
      }
    },
    
    /**
     * Poprzedni theme
     */
    previousTheme() {
      if (this.themeManager) {
        this.themeManager.previousTheme();
      }
    },
    
    /**
     * Losowy theme
     */
    randomTheme() {
      if (this.themeManager) {
        this.themeManager.randomTheme();
      }
    },
    
    /**
     * Obsługa zmiany niestandardowego koloru
     */
    handleCustomColorChange() {
      if (this.themeManager) {
        this.themeManager.setCSSVariable('--color-primary', this.customColor);
        this.themeManager.setCSSVariable('--color-primary-darker', this.customColor + '99');
      }
    },
    
    /**
     * Resetuj kolory
     */
    resetColors() {
      if (this.themeManager) {
        this.themeManager.resetCSSVariables();
      }
    },
    
    /**
     * Eksportuj konfigurację
     */
    exportConfig() {
      if (this.themeManager) {
        const config = this.themeManager.exportConfig();
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
    },
    
    /**
     * Importuj konfigurację
     */
    importConfig(event) {
      const file = event.target.files[0];
      if (file && this.themeManager) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const config = JSON.parse(e.target.result);
            this.themeManager.importConfig(config);
          } catch (error) {
            console.error('Błąd importu konfiguracji:', error);
            alert('Błąd importu konfiguracji theme');
          }
        };
        reader.readAsText(file);
      }
      
      // Wyczyść input
      event.target.value = '';
    },
    
    /**
     * Skróty klawiszowe
     */
    setupKeyboardShortcuts() {
      this.keyboardHandler = (e) => {
        // Ctrl+Shift+T - następny theme
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
          e.preventDefault();
          this.nextTheme();
        }
        
        // Ctrl+Shift+R - losowy theme
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
          e.preventDefault();
          this.randomTheme();
        }
        
        // Ctrl+Shift+1-8 - konkretne theme
        if (e.ctrlKey && e.shiftKey && e.key >= '1' && e.key <= '8') {
          e.preventDefault();
          const themeNames = Object.keys(this.availableThemes);
          const index = parseInt(e.key) - 1;
          if (themeNames[index]) {
            this.setTheme(themeNames[index]);
          }
        }
      };
      
      document.addEventListener('keydown', this.keyboardHandler);
    },
    
    /**
     * Kapitalizuj pierwszą literę
     */
    capitalizeFirst(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    /**
     * Czyszczenie
     */
    cleanup() {
      if (this.themeManager) {
        this.themeManager.off('onThemeChange', this.handleThemeManagerChange);
        this.themeManager.off('onThemeLoad', this.handleThemeManagerLoad);
      }
      
      if (this.keyboardHandler) {
        document.removeEventListener('keydown', this.keyboardHandler);
      }
    }
  }
};
</script>

<style scoped>
/* Podstawowe style dla komponentu Vue */
.excalidraw-vue-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  text-align: center;
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.app-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.theme-controls-container {
  background: #fff;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.theme-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-selector label {
  font-weight: 500;
  color: #333;
}

.theme-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
}

.theme-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.theme-button {
  padding: 0.25rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.theme-button:hover {
  background: #f8f9fa;
  border-color: #999;
}

.theme-button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.theme-control-panel {
  flex: 1;
  min-width: 300px;
}

.theme-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.theme-navigation button {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
}

.theme-navigation button:hover {
  background: #f8f9fa;
}

.current-theme-info {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.current-theme-name {
  color: #007bff;
  font-weight: 500;
}

.toggle-advanced {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.25rem 0;
}

.advanced-content {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.85rem;
}

.custom-color-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.custom-color-picker input[type="color"] {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.custom-color-picker button {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
}

.config-management {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.config-management button,
.import-config {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: none;
  color: #333;
}

.keyboard-shortcuts h4 {
  margin: 0.5rem 0 0.25rem 0;
  font-size: 0.9rem;
}

.keyboard-shortcuts ul {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.8rem;
}

.keyboard-shortcuts kbd {
  background: #e9ecef;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.75rem;
}

.excalidraw-theme-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.excalidraw-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f8f9fa;
}

.loading-spinner {
  padding: 2rem;
  font-size: 1.1rem;
  color: #666;
}

.excalidraw-container {
  height: 100%;
  width: 100%;
}

#excalidraw-app {
  height: 100%;
  width: 100%;
}

.app-footer {
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-top: 1px solid #e9ecef;
  text-align: center;
  font-size: 0.8rem;
  color: #666;
}

/* Responsywność */
@media (max-width: 768px) {
  .theme-controls-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .theme-buttons {
    justify-content: center;
  }
  
  .theme-control-panel {
    min-width: auto;
  }
  
  .theme-navigation {
    justify-content: center;
  }
  
  .config-management {
    justify-content: center;
  }
}
</style>

<!-- 
Przykłady użycia w Vue.js:

1. Podstawowe użycie:
<ExcalidrawVueTheme />

2. Z niestandardowymi opcjami:
<ExcalidrawVueTheme 
  :theme-options="{ defaultTheme: 'blue' }"
  :show-theme-controls="true"
  @theme-changed="handleThemeChange"
/>

3. W komponencie rodzica:
<template>
  <div>
    <ExcalidrawVueTheme 
      :initial-data="excalidrawData"
      :theme-options="themeOptions"
      @theme-changed="onThemeChanged"
      @theme-loaded="onThemeLoaded"
    />
  </div>
</template>

<script>
import ExcalidrawVueTheme from './vue-theme-example.vue';

export default {
  components: {
    ExcalidrawVueTheme
  },
  data() {
    return {
      excalidrawData: null,
      themeOptions: {
        defaultTheme: 'green',
        autoSave: true
      }
    };
  },
  methods: {
    onThemeChanged(theme) {
      console.log('Theme zmieniony na:', theme);
    },
    onThemeLoaded(theme) {
      console.log('Theme załadowany:', theme);
    }
  }
};
</script>

4. Jako plugin Vue:
// main.js
import { createApp } from 'vue';
import ExcalidrawVueTheme from './vue-theme-example.vue';

const app = createApp(App);
app.component('ExcalidrawVueTheme', ExcalidrawVueTheme);
app.mount('#app');
-->