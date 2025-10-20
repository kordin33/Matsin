/**
 * EXCALIDRAW THEME WRAPPER - Angular Integration Example
 * 
 * Ten plik pokazuje jak zintegrować theme wrapper z aplikacją Angular
 * i jak stworzyć komponenty do zarządzania theme.
 * 
 * @version 1.0.0
 */

import { 
  Component, 
  OnInit, 
  OnDestroy, 
  Input, 
  Output, 
  EventEmitter, 
  ViewChild, 
  ElementRef,
  ChangeDetectorRef,
  Injectable
} from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Import theme wrapper (zakładając, że jest dostępny)
// import { ExcalidrawThemeManager } from './theme-wrapper.js';

/**
 * Serwis do zarządzania theme Excalidraw
 */
@Injectable({
  providedIn: 'root'
})
export class ExcalidrawThemeService {
  private themeManager: any = null;
  private currentThemeSubject = new BehaviorSubject<string>('');
  private availableThemesSubject = new BehaviorSubject<{[key: string]: string}>({});
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  
  public currentTheme$ = this.currentThemeSubject.asObservable();
  public availableThemes$ = this.availableThemesSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  
  constructor() {
    this.initializeThemeManager();
  }
  
  /**
   * Inicjalizacja theme managera
   */
  private initializeThemeManager(options: any = {}) {
    // Sprawdź czy ExcalidrawThemeManager jest dostępny
    if (typeof (window as any).ExcalidrawThemeManager === 'undefined') {
      console.error('ExcalidrawThemeManager nie jest dostępny. Upewnij się, że theme-wrapper.js jest załadowany.');
      this.isLoadingSubject.next(false);
      return;
    }
    
    const defaultOptions = {
      containerSelector: '.excalidraw-theme-wrapper',
      storageKey: 'excalidraw-angular-theme',
      defaultTheme: '',
      autoSave: true,
      ...options
    };
    
    this.themeManager = new (window as any).ExcalidrawThemeManager(defaultOptions);
    
    // Callback dla zmiany theme
    this.themeManager.on('onThemeChange', (newTheme: string) => {
      this.currentThemeSubject.next(newTheme);
    });
    
    this.themeManager.on('onThemeLoad', (theme: string) => {
      this.currentThemeSubject.next(theme);
      this.isLoadingSubject.next(false);
    });
    
    // Pobierz dostępne theme
    this.availableThemesSubject.next(this.themeManager.getAvailableThemes());
  }
  
  /**
   * Ustaw theme
   */
  setTheme(themeName: string): void {
    if (this.themeManager) {
      this.themeManager.setTheme(themeName);
    }
  }
  
  /**
   * Następny theme
   */
  nextTheme(): void {
    if (this.themeManager) {
      this.themeManager.nextTheme();
    }
  }
  
  /**
   * Poprzedni theme
   */
  previousTheme(): void {
    if (this.themeManager) {
      this.themeManager.previousTheme();
    }
  }
  
  /**
   * Losowy theme
   */
  randomTheme(): void {
    if (this.themeManager) {
      this.themeManager.randomTheme();
    }
  }
  
  /**
   * Pobierz aktualny theme
   */
  getCurrentTheme(): string {
    return this.themeManager ? this.themeManager.getCurrentTheme() : '';
  }
  
  /**
   * Pobierz dostępne theme
   */
  getAvailableThemes(): {[key: string]: string} {
    return this.themeManager ? this.themeManager.getAvailableThemes() : {};
  }
  
  /**
   * Ustaw zmienną CSS
   */
  setCSSVariable(varName: string, value: string): void {
    if (this.themeManager) {
      this.themeManager.setCSSVariable(varName, value);
    }
  }
  
  /**
   * Resetuj zmienne CSS
   */
  resetCSSVariables(): void {
    if (this.themeManager) {
      this.themeManager.resetCSSVariables();
    }
  }
  
  /**
   * Eksportuj konfigurację
   */
  exportConfig(): any {
    return this.themeManager ? this.themeManager.exportConfig() : null;
  }
  
  /**
   * Importuj konfigurację
   */
  importConfig(config: any): void {
    if (this.themeManager) {
      this.themeManager.importConfig(config);
    }
  }
  
  /**
   * Pobierz zmienne CSS
   */
  getCSSVariables(): {[key: string]: string} {
    return this.themeManager ? this.themeManager.getCSSVariables() : {};
  }
}

/**
 * Komponent selektora theme
 */
@Component({
  selector: 'app-theme-selector',
  template: `
    <div class="theme-selector" [class]="className">
      <label for="theme-select">Wybierz theme:</label>
      <select 
        id="theme-select"
        [value]="selectedTheme"
        (change)="onThemeChange($event)"
        class="theme-select"
      >
        <option 
          *ngFor="let theme of themeEntries" 
          [value]="theme.key"
        >
          {{ capitalizeFirst(theme.key) }}
        </option>
      </select>
    </div>
  `,
  styles: [`
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
  `]
})
export class ThemeSelectorComponent implements OnInit, OnDestroy {
  @Input() className: string = '';
  @Output() themeChanged = new EventEmitter<string>();
  
  selectedTheme: string = 'default';
  themeEntries: {key: string, value: string}[] = [];
  
  private destroy$ = new Subject<void>();
  
  constructor(private themeService: ExcalidrawThemeService) {}
  
  ngOnInit(): void {
    // Subskrybuj zmiany theme
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currentTheme => {
        const availableThemes = this.themeService.getAvailableThemes();
        this.selectedTheme = Object.keys(availableThemes).find(
          key => availableThemes[key] === currentTheme
        ) || 'default';
      });
    
    // Subskrybuj dostępne theme
    this.themeService.availableThemes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(themes => {
        this.themeEntries = Object.entries(themes).map(([key, value]) => ({ key, value }));
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onThemeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const themeName = target.value;
    this.themeService.setTheme(themeName);
    this.themeChanged.emit(themeName);
  }
  
  capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Komponent przycisków theme
 */
@Component({
  selector: 'app-theme-buttons',
  template: `
    <div class="theme-buttons" [class]="className">
      <button
        *ngFor="let theme of themeEntries"
        (click)="onThemeClick(theme.key)"
        [class.active]="theme.value === currentTheme"
        class="theme-button"
        [attr.data-theme]="theme.key"
      >
        {{ capitalizeFirst(theme.key) }}
      </button>
    </div>
  `,
  styles: [`
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
  `]
})
export class ThemeButtonsComponent implements OnInit, OnDestroy {
  @Input() className: string = '';
  @Output() themeChanged = new EventEmitter<string>();
  
  currentTheme: string = '';
  themeEntries: {key: string, value: string}[] = [];
  
  private destroy$ = new Subject<void>();
  
  constructor(private themeService: ExcalidrawThemeService) {}
  
  ngOnInit(): void {
    // Subskrybuj zmiany theme
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currentTheme => {
        this.currentTheme = currentTheme;
      });
    
    // Subskrybuj dostępne theme
    this.themeService.availableThemes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(themes => {
        this.themeEntries = Object.entries(themes).map(([key, value]) => ({ key, value }));
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onThemeClick(themeName: string): void {
    this.themeService.setTheme(themeName);
    this.themeChanged.emit(themeName);
  }
  
  capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Komponent panelu kontrolnego theme
 */
@Component({
  selector: 'app-theme-control-panel',
  template: `
    <div class="theme-control-panel" [class]="className">
      <div class="theme-controls-basic">
        <h3>Kontrola Theme</h3>
        
        <div class="theme-navigation">
          <button (click)="previousTheme()" title="Poprzedni theme">
            ← Poprzedni
          </button>
          <button (click)="nextTheme()" title="Następny theme">
            Następny →
          </button>
          <button (click)="randomTheme()" title="Losowy theme">
            🎲 Losowy
          </button>
        </div>
        
        <div class="current-theme-info">
          <strong>Aktualny theme:</strong> 
          <span class="current-theme-name">{{ currentThemeName }}</span>
        </div>
      </div>
      
      <div class="theme-controls-advanced">
        <button 
          (click)="showAdvanced = !showAdvanced"
          class="toggle-advanced"
        >
          {{ showAdvanced ? '▼' : '▶' }} Zaawansowane opcje
        </button>
        
        <div *ngIf="showAdvanced" class="advanced-options">
          <div class="custom-color-picker">
            <label for="custom-color">Niestandardowy kolor główny:</label>
            <input
              id="custom-color"
              type="color"
              [(ngModel)]="customColor"
              (input)="onCustomColorChange()"
            />
            <button (click)="resetColors()">Resetuj kolory</button>
          </div>
          
          <div class="config-management">
            <button (click)="exportConfig()">📥 Eksportuj konfigurację</button>
            <label class="import-config">
              📤 Importuj konfigurację
              <input
                #fileInput
                type="file"
                accept=".json"
                (change)="importConfig($event)"
                style="display: none"
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
  `,
  styles: [`
    .theme-control-panel {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
    }
    
    .theme-controls-basic h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      color: #333;
    }
    
    .theme-navigation {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
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
      margin-bottom: 1rem;
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
    
    .advanced-options {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: white;
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
  `]
})
export class ThemeControlPanelComponent implements OnInit, OnDestroy {
  @Input() className: string = '';
  @Output() themeChanged = new EventEmitter<string>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  currentTheme: string = '';
  currentThemeName: string = 'Default';
  showAdvanced: boolean = false;
  customColor: string = '#6965db';
  
  private destroy$ = new Subject<void>();
  
  constructor(private themeService: ExcalidrawThemeService) {}
  
  ngOnInit(): void {
    // Subskrybuj zmiany theme
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currentTheme => {
        this.currentTheme = currentTheme;
        this.updateCurrentThemeName();
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private updateCurrentThemeName(): void {
    const availableThemes = this.themeService.getAvailableThemes();
    const themeName = Object.keys(availableThemes).find(
      key => availableThemes[key] === this.currentTheme
    );
    this.currentThemeName = this.capitalizeFirst(themeName || 'default');
  }
  
  nextTheme(): void {
    this.themeService.nextTheme();
  }
  
  previousTheme(): void {
    this.themeService.previousTheme();
  }
  
  randomTheme(): void {
    this.themeService.randomTheme();
  }
  
  onCustomColorChange(): void {
    this.themeService.setCSSVariable('--color-primary', this.customColor);
    this.themeService.setCSSVariable('--color-primary-darker', this.customColor + '99');
  }
  
  resetColors(): void {
    this.themeService.resetCSSVariables();
  }
  
  exportConfig(): void {
    const config = this.themeService.exportConfig();
    if (config) {
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
  }
  
  importConfig(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          this.themeService.importConfig(config);
        } catch (error) {
          console.error('Błąd importu konfiguracji:', error);
          alert('Błąd importu konfiguracji theme');
        }
      };
      reader.readAsText(file);
    }
    
    // Wyczyść input
    target.value = '';
  }
  
  capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Główny komponent Excalidraw z theme wrapper
 */
@Component({
  selector: 'app-excalidraw-with-theme',
  template: `
    <div class="excalidraw-angular-app">
      <header class="app-header">
        <h1>Excalidraw z Theme Wrapper - Angular</h1>
        <p>Przykład integracji z Angular</p>
      </header>
      
      <!-- Kontrolki theme -->
      <div *ngIf="showThemeControls" class="theme-controls-container">
        <app-theme-selector 
          className="theme-selector-compact"
          (themeChanged)="onThemeChanged($event)"
        ></app-theme-selector>
        
        <app-theme-buttons 
          className="theme-buttons-compact"
          (themeChanged)="onThemeChanged($event)"
        ></app-theme-buttons>
        
        <app-theme-control-panel 
          className="theme-panel-compact"
          (themeChanged)="onThemeChanged($event)"
        ></app-theme-control-panel>
      </div>
      
      <!-- Kontener Excalidraw -->
      <div 
        class="excalidraw-theme-wrapper"
        [class]="currentTheme"
        #excalidrawContainer
      >
        <div *ngIf="isLoading" class="excalidraw-loading">
          <div class="loading-spinner">Ładowanie theme...</div>
        </div>
        
        <div *ngIf="!isLoading" class="excalidraw-container">
          <!-- Tutaj będzie renderowany Excalidraw -->
          <div #excalidrawApp id="excalidraw-app"></div>
        </div>
      </div>
      
      <footer class="app-footer">
        <p>Użyj skrótów klawiszowych lub kontrolek powyżej aby zmienić theme</p>
      </footer>
    </div>
  `,
  styles: [`
    .excalidraw-angular-app {
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
    }
  `]
})
export class ExcalidrawWithThemeComponent implements OnInit, OnDestroy {
  @Input() initialData: any = null;
  @Input() themeOptions: any = {};
  @Input() showThemeControls: boolean = true;
  @Output() themeChanged = new EventEmitter<string>();
  @Output() excalidrawChanged = new EventEmitter<any>();
  
  @ViewChild('excalidrawContainer') excalidrawContainer!: ElementRef;
  @ViewChild('excalidrawApp') excalidrawApp!: ElementRef;
  
  currentTheme: string = '';
  isLoading: boolean = true;
  excalidrawAPI: any = null;
  
  private destroy$ = new Subject<void>();
  private keyboardHandler?: (e: KeyboardEvent) => void;
  
  constructor(
    private themeService: ExcalidrawThemeService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    // Subskrybuj zmiany theme
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currentTheme => {
        this.currentTheme = currentTheme;
        this.cdr.detectChanges();
      });
    
    // Subskrybuj stan ładowania
    this.themeService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.isLoading = isLoading;
        if (!isLoading) {
          this.initializeExcalidraw();
        }
        this.cdr.detectChanges();
      });
    
    // Skróty klawiszowe
    this.setupKeyboardShortcuts();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }
  }
  
  private async initializeExcalidraw(): Promise<void> {
    try {
      // Tutaj można zainicjalizować Excalidraw
      // const { Excalidraw } = await import('@excalidraw/excalidraw');
      // Implementacja zależy od sposobu importu Excalidraw w Angular
      
      console.log('Excalidraw zostanie zainicjalizowany tutaj');
      
    } catch (error) {
      console.error('Błąd inicjalizacji Excalidraw:', error);
    }
  }
  
  private setupKeyboardShortcuts(): void {
    this.keyboardHandler = (e: KeyboardEvent) => {
      // Ctrl+Shift+T - następny theme
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.themeService.nextTheme();
      }
      
      // Ctrl+Shift+R - losowy theme
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        this.themeService.randomTheme();
      }
      
      // Ctrl+Shift+1-8 - konkretne theme
      if (e.ctrlKey && e.shiftKey && e.key >= '1' && e.key <= '8') {
        e.preventDefault();
        const availableThemes = this.themeService.getAvailableThemes();
        const themeNames = Object.keys(availableThemes);
        const index = parseInt(e.key) - 1;
        if (themeNames[index]) {
          this.themeService.setTheme(themeNames[index]);
        }
      }
    };
    
    document.addEventListener('keydown', this.keyboardHandler);
  }
  
  onThemeChanged(theme: string): void {
    this.themeChanged.emit(theme);
  }
}

/**
 * Moduł Angular dla theme wrapper
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ThemeSelectorComponent,
    ThemeButtonsComponent,
    ThemeControlPanelComponent,
    ExcalidrawWithThemeComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    ThemeSelectorComponent,
    ThemeButtonsComponent,
    ThemeControlPanelComponent,
    ExcalidrawWithThemeComponent
  ],
  providers: [
    ExcalidrawThemeService
  ]
})
export class ExcalidrawThemeModule {}

/**
 * Przykłady użycia w Angular:
 * 
 * 1. W module aplikacji:
 * import { ExcalidrawThemeModule } from './excalidraw-theme.module';
 * 
 * @NgModule({
 *   imports: [ExcalidrawThemeModule]
 * })
 * export class AppModule {}
 * 
 * 2. W komponencie:
 * <app-excalidraw-with-theme 
 *   [themeOptions]="{ defaultTheme: 'blue' }"
 *   [showThemeControls]="true"
 *   (themeChanged)="onThemeChanged($event)"
 * ></app-excalidraw-with-theme>
 * 
 * 3. Osobne komponenty:
 * <app-theme-selector (themeChanged)="onThemeChanged($event)"></app-theme-selector>
 * <app-theme-buttons (themeChanged)="onThemeChanged($event)"></app-theme-buttons>
 * <app-theme-control-panel (themeChanged)="onThemeChanged($event)"></app-theme-control-panel>
 * 
 * 4. Używanie serwisu:
 * constructor(private themeService: ExcalidrawThemeService) {}
 * 
 * ngOnInit() {
 *   this.themeService.currentTheme$.subscribe(theme => {
 *     console.log('Aktualny theme:', theme);
 *   });
 * }
 * 
 * changeTheme() {
 *   this.themeService.setTheme('blue');
 * }
 */