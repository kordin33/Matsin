# Minimal Theme Implementation

<cite>
**Referenced Files in This Document**   
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss)
- [minimal-theme-example.html](file://excalidraw/excalidraw-app/minimal-theme-example.html)
- [MINIMAL-THEME-GUIDE.md](file://excalidraw/excalidraw-app/MINIMAL-THEME-GUIDE.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Theme Files](#core-theme-files)
3. [CSS Variables and Styling](#css-variables-and-styling)
4. [Color Scheme Customization](#color-scheme-customization)
5. [Font and Spacing Adjustments](#font-and-spacing-adjustments)
6. [Integration with HTML Pages](#integration-with-html-pages)
7. [Dark Mode Implementation](#dark-mode-implementation)
8. [Advanced Component Styling](#advanced-component-styling)
9. [Common Issues and Solutions](#common-issues-and-solutions)
10. [Performance Benefits](#performance-benefits)

## Introduction
The Minimal Theme Implementation in Excalidraw provides a lightweight approach to customizing the application's appearance through simple CSS overrides. This documentation details how to use the minimal-theme-wrapper.scss file for quick styling adjustments, including color schemes, font families, and spacing. The approach enables developers to integrate customized themes into static HTML pages with minimal code, as demonstrated in the minimal-theme-example.html file. This lightweight theming solution offers performance benefits for simple integrations while maintaining full functionality.

## Core Theme Files
The minimal theme implementation revolves around two primary files that work together to provide a customizable styling experience. These files serve as the foundation for theme customization and demonstration.

**Section sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L1-L201)
- [minimal-theme-example.html](file://excalidraw/excalidraw-app/minimal-theme-example.html#L1-L152)

## CSS Variables and Styling
The minimal theme approach utilizes CSS variables to enable easy customization of visual elements. The theme system is built around a set of predefined variables that control various aspects of the UI, allowing for comprehensive styling with minimal code changes.

```mermaid
classDiagram
class ThemeVariables {
+--glass-bg : rgba(255,255,255,0.08)
+--glass-border : rgba(255,255,255,0.18)
+--glass-tint : rgba(255,255,255,0.1)
+--glass-shadow : 0 8px 32px rgba(0,0,0,0.12)
+--glass-radius : 12px
+--brand-primary : #6366f1
+--brand-secondary : #8b5cf6
+--surface-primary : rgba(255,255,255,0.95)
+--surface-secondary : rgba(248,250,252,0.9)
+--text-primary : #1e293b
+--text-secondary : #64748b
+--border-light : rgba(226,232,240,0.8)
+--shadow-sm : 0 1px 2px rgba(0,0,0,0.05)
+--shadow-md : 0 4px 6px rgba(0,0,0,0.07)
+--shadow-lg : 0 10px 15px rgba(0,0,0,0.1)
+--default-icon-size : 1.25rem
+--border-radius-md : 10px
+--border-radius-lg : 14px
}
class ThemeComponents {
+Toolbar
+DropdownMenu
+IslandComponents
+ModalContent
+TextInputs
+Scrollbars
}
ThemeVariables --> ThemeComponents : "applies styles to"
```

**Diagram sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L15-L50)

**Section sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L15-L50)

## Color Scheme Customization
Customizing color schemes in the minimal theme involves modifying CSS variables that control primary colors, backgrounds, and text elements. The theme system provides specific variables for different UI components, allowing for precise control over the visual appearance.

```mermaid
flowchart TD
Start([Start Theme Customization]) --> PrimaryColors["Modify --color-primary variables"]
PrimaryColors --> BackgroundColors["Adjust --default-bg-color and --island-bg-color"]
BackgroundColors --> TextColors["Set --text-primary-color"]
TextColors --> ButtonColors["Customize button hover and active states"]
ButtonColors --> ApplyChanges["Save and apply changes"]
ApplyChanges --> Preview["Preview in browser"]
Preview --> TestDarkMode["Test in dark mode"]
TestDarkMode --> End([Theme Complete])
style Start fill:#4CAF50,stroke:#388E3C
style End fill:#4CAF50,stroke:#388E3C
```

**Diagram sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L9-L33)
- [MINIMAL-THEME-GUIDE.md](file://excalidraw/excalidraw-app/MINIMAL-THEME-GUIDE.md#L9-L46)

**Section sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L9-L33)
- [MINIMAL-THEME-GUIDE.md](file://excalidraw/excalidraw-app/MINIMAL-THEME-GUIDE.md#L9-L46)

## Font and Spacing Adjustments
The minimal theme system allows for customization of font sizes, button dimensions, and spacing through CSS variables. These adjustments enable developers to create a consistent visual hierarchy and improve user experience.

```mermaid
erDiagram
SPACING_VARIABLES {
string button_size "Default button size"
string icon_size "Default icon size"
string border_radius_md "Medium border radius"
string border_radius_lg "Large border radius"
string shadow_island "Island shadow"
string modal_shadow "Modal shadow"
}
FONT_VARIABLES {
string text_primary "Primary text color"
string popup_text "Popup text color"
}
SPACING_VARIABLES ||--o{ THEME_WRAPPER : "defines"
FONT_VARIABLES ||--o{ THEME_WRAPPER : "defines"
```

**Diagram sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L35-L46)
- [MINIMAL-THEME-GUIDE.md](file://excalidraw/excalidraw-app/MINIMAL-THEME-GUIDE.md#L35-L46)

**Section sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L35-L46)
- [MINIMAL-THEME-GUIDE.md](file://excalidraw/excalidraw-app/MINIMAL-THEME-GUIDE.md#L35-L46)

## Integration with HTML Pages
Integrating the minimal theme into static HTML pages requires linking the necessary CSS files and setting up the proper HTML structure. The implementation follows a straightforward pattern that can be easily replicated across different projects.

```mermaid
sequenceDiagram
participant HTML as HTML Page
participant CSS as CSS Files
participant JS as JavaScript
HTML->>CSS : Link index.scss
HTML->>CSS : Link minimal-theme-wrapper.scss
HTML->>HTML : Create excalidraw-minimal-wrapper div
HTML->>HTML : Add container for Excalidraw
HTML->>JS : Import Excalidraw module
JS->>JS : Create root container
JS->>JS : Render Excalidraw component
JS->>HTML : Display themed interface
```

**Diagram sources**
- [minimal-theme-example.html](file://excalidraw/excalidraw-app/minimal-theme-example.html#L1-L152)
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L1-L14)

**Section sources**
- [minimal-theme-example.html](file://excalidraw/excalidraw-app/minimal-theme-example.html#L1-L152)

## Dark Mode Implementation
The minimal theme includes built-in support for dark mode through media queries and CSS variables. This allows for automatic theme switching based on user preferences or manual toggling through JavaScript.

```mermaid
stateDiagram-v2
[*] --> LightMode
LightMode --> DarkMode : "prefers-color-scheme : dark"
LightMode --> DarkMode : "manual toggle"
DarkMode --> LightMode : "prefers-color-scheme : light"
DarkMode --> LightMode : "manual toggle"
LightMode : Light Theme Variables
DarkMode : Dark Theme Variables
note right of LightMode
--glass-bg : rgba(255,255,255,0.08)
--surface-primary : rgba(255,255,255,0.95)
--text-primary : #1e293b
end note
note right of DarkMode
--glass-bg : rgba(0,0,0,0.15)
--surface-primary : rgba(15,23,42,0.95)
--text-primary : #f1f5f9
end note
```

**Diagram sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L180-L195)
- [minimal-theme-example.html](file://excalidraw/excalidraw-app/minimal-theme-example.html#L100-L150)

**Section sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L180-L195)
- [minimal-theme-example.html](file://excalidraw/excalidraw-app/minimal-theme-example.html#L100-L150)

## Advanced Component Styling
Beyond basic color and spacing adjustments, the minimal theme system allows for advanced styling of specific components such as toolbars, dropdown menus, and input elements. These customizations maintain the glass-morphism aesthetic while providing enhanced visual feedback.

```mermaid
classDiagram
class Toolbar {
+background : linear-gradient
+border : 1px solid var(--glass-border)
+border-radius : var(--glass-radius)
+box-shadow : var(--glass-shadow)
+backdrop-filter : blur(30px)
}
class DropdownMenu {
+background : linear-gradient
+border : 1px solid var(--glass-border)
+border-radius : var(--glass-radius)
+box-shadow : var(--glass-shadow)
+backdrop-filter : blur(30px)
+position : absolute
}
class InputElements {
+background : linear-gradient
+border : 1px solid var(--glass-border)
+border-radius : var(--glass-radius)
+box-shadow : var(--glass-shadow)
+backdrop-filter : blur(30px)
}
class Scrollbar {
+width : 8px
+track : rgba(255,255,255,0.1)
+thumb : glass effect
}
Toolbar --> GlassEffect : "inherits"
DropdownMenu --> GlassEffect : "inherits"
InputElements --> GlassEffect : "inherits"
Scrollbar --> GlassEffect : "inherits"
class GlassEffect {
+--glass-bg
+--glass-border
+--glass-tint
+--glass-shadow
+--glass-radius
+backdrop-filter
}
```

**Diagram sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L52-L179)

**Section sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L52-L179)

## Common Issues and Solutions
When implementing the minimal theme, developers may encounter specific challenges related to CSS specificity, browser compatibility, and responsive design. Understanding these common issues and their solutions ensures a smooth implementation process.

```mermaid
flowchart TD
Issue1["CSS specificity conflicts"] --> Solution1["Use !important sparingly"]
Issue2["Browser compatibility"] --> Solution2["Provide fallbacks for backdrop-filter"]
Issue3["Responsive design issues"] --> Solution3["Test across different screen sizes"]
Issue4["Dark mode inconsistencies"] --> Solution4["Verify all variables are defined"]
Issue5["Performance concerns"] --> Solution5["Minimize unnecessary re-renders"]
Solution1 --> BestPractice1["Follow CSS cascade principles"]
Solution2 --> BestPractice2["Use @supports for feature detection"]
Solution3 --> BestPractice3["Implement responsive breakpoints"]
Solution4 --> BestPractice4["Test both light and dark modes"]
Solution5 --> BestPractice5["Optimize CSS calculations"]
```

**Diagram sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L180-L195)
- [minimal-theme-example.html](file://excalidraw/excalidraw-app/minimal-theme-example.html#L1-L152)

**Section sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L180-L195)
- [minimal-theme-example.html](file://excalidraw/excalidraw-app/minimal-theme-example.html#L1-L152)

## Performance Benefits
The minimal theme implementation offers significant performance advantages due to its lightweight nature and efficient CSS architecture. By focusing on essential styling with minimal code, this approach reduces bundle size and improves rendering performance.

```mermaid
graph TB
subgraph "Performance Advantages"
A[Small CSS Bundle Size]
B[Efficient Rendering]
C[Fast Load Times]
D[Low Memory Usage]
E[Smooth Animations]
end
subgraph "Implementation Factors"
F[CSS Variables]
G[Minimal Overrides]
H[No External Dependencies]
I[Optimized Selectors]
J[Reduced Specificity]
end
F --> A
G --> B
H --> C
I --> D
J --> E
```

**Diagram sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L1-L201)

**Section sources**
- [minimal-theme-wrapper.scss](file://excalidraw/excalidraw-app/minimal-theme-wrapper.scss#L1-L201)