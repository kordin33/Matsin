# Exposed Methods

<cite>
**Referenced Files in This Document**   
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts)
- [appState.ts](file://excalidraw/packages/excalidraw/appState.ts)
- [library.ts](file://excalidraw/packages/excalidraw/data/library.ts)
- [scene.ts](file://excalidraw/packages/excalidraw/scene/scene.ts)
- [clients.ts](file://excalidraw/packages/excalidraw/clients.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Imperative Methods](#core-imperative-methods)
3. [Scene Management Methods](#scene-management-methods)
4. [Library Management Methods](#library-management-methods)
5. [Collaboration API Methods](#collaboration-api-methods)
6. [TypeScript Definitions](#typescript-definitions)
7. [Usage Examples with React useRef](#usage-examples-with-react-useref)
8. [Integration with External State Management](#integration-with-external-state-management)
9. [Undo/Redo Implementation Patterns](#undo-redo-implementation-patterns)
10. [Common Issues and Solutions](#common-issues-and-solutions)

## Introduction
This document details the imperative methods exposed by the Excalidraw component through its ref API. These methods enable programmatic control over the drawing canvas, allowing developers to manipulate elements, manage scene state, import libraries, and handle real-time collaboration. The API is designed to work seamlessly with React applications, providing fine-grained control over the Excalidraw component's behavior and state.

## Core Imperative Methods

The Excalidraw component exposes a comprehensive set of imperative methods through its ref, enabling direct manipulation of the canvas and its contents. These methods are accessible via the `excalidrawAPI` callback prop and provide low-level access to the component's functionality.

**Section sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

## Scene Management Methods

### updateScene
The `updateScene` method allows for programmatic modification of both elements and appState. It accepts a partial scene data object and applies the changes to the current scene.

```mermaid
flowchart TD
Start([updateScene called]) --> ValidateInput["Validate input parameters"]
ValidateInput --> InputValid{"Input valid?"}
InputValid --> |No| ReturnError["Return error"]
InputValid --> |Yes| ProcessElements["Process elements if provided"]
ProcessElements --> ProcessAppState["Process appState if provided"]
ProcessAppState --> UpdateHistory["Update history stack"]
UpdateHistory --> RenderScene["Render updated scene"]
RenderScene --> End([Method complete])
```

**Diagram sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [scene.ts](file://excalidraw/packages/excalidraw/scene/scene.ts)

### resetScene
The `resetScene` method clears or resets the canvas to its initial state. It can be used to completely clear the drawing surface or restore it to a predefined initial state.

```mermaid
flowchart TD
Start([resetScene called]) --> CheckParams["Check reset parameters"]
CheckParams --> HasData{"Initial data provided?"}
HasData --> |Yes| ApplyInitialData["Apply initial data"]
HasData --> |No| ClearElements["Clear all elements"]
ClearElements --> ResetAppState["Reset appState to defaults"]
ResetAppState --> ClearFiles["Clear binary files"]
ClearFiles --> UpdateHistory["Clear history stack"]
UpdateHistory --> RenderEmpty["Render empty scene"]
RenderEmpty --> End([Reset complete])
```

**Diagram sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [scene.ts](file://excalidraw/packages/excalidraw/scene/scene.ts)

### getSceneElements
The `getSceneElements` method retrieves the current elements from the scene, returning a readonly array of non-deleted elements.

```mermaid
flowchart TD
Start([getSceneElements called]) --> AccessStore["Access scene element store"]
AccessStore --> FilterDeleted["Filter out deleted elements"]
FilterDeleted --> SortElements["Sort elements by index"]
SortElements --> ReturnElements["Return readonly array of elements"]
ReturnElements --> End([Elements returned])
```

**Diagram sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [scene.ts](file://excalidraw/packages/excalidraw/scene/scene.ts)

**Section sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)
- [scene.ts](file://excalidraw/packages/excalidraw/scene/scene.ts)

## Library Management Methods

### importLibrary
The `importLibrary` method loads predefined shapes and elements from a library, making them available for use in the current session.

```mermaid
flowchart TD
Start([importLibrary called]) --> ValidateSource["Validate library source"]
ValidateSource --> SourceValid{"Source valid?"}
SourceValid --> |No| ReturnError["Return error"]
SourceValid --> |Yes| FetchLibrary["Fetch library data"]
FetchLibrary --> ParseData["Parse library items"]
ParseData --> ValidateItems["Validate individual items"]
ValidateItems --> AddToStore["Add items to library store"]
AddToStore --> NotifyObservers["Notify observers of change"]
NotifyObservers --> UpdateUI["Update library UI"]
UpdateUI --> End([Library imported])
```

**Diagram sources**
- [library.ts](file://excalidraw/packages/excalidraw/data/library.ts)
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)

**Section sources**
- [library.ts](file://excalidraw/packages/excalidraw/data/library.ts)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

## Collaboration API Methods

### broadcastElements
The `broadcastElements` method enables real-time synchronization of elements across collaborators in a shared session.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant API as "ExcalidrawAPI"
participant Collab as "CollaborationService"
participant Others as "Other Collaborators"
Client->>API : broadcastElements(elements)
API->>API : Validate elements
API->>Collab : emitUpdate(elements, clientId)
Collab->>Collab : Broadcast to room
Collab->>Others : Receive update
Others->>Others : Apply elements
Others->>Collab : Acknowledge receipt
Collab->>API : Confirm broadcast
API->>Client : Broadcast complete
```

**Diagram sources**
- [clients.ts](file://excalidraw/packages/excalidraw/clients.ts)
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)

**Section sources**
- [clients.ts](file://excalidraw/packages/excalidraw/clients.ts)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

## TypeScript Definitions

The Excalidraw API provides comprehensive TypeScript definitions for type safety and IDE support. The core API interface is defined as follows:

```mermaid
classDiagram
class ExcalidrawImperativeAPI {
+updateScene(sceneData : SceneData) : void
+resetScene() : void
+getSceneElements() : readonly NonDeletedExcalidrawElement[]
+importLibrary(libraryItems : LibraryItems_anyVersion | Blob) : Promise<void>
+broadcastElements(elements : readonly ExcalidrawElement[]) : void
+history : HistoryAPI
+collab : CollabAPI
+library : LibraryAPI
}
class HistoryAPI {
+undo() : void
+redo() : void
+clear() : void
+canUndo() : boolean
+canRedo() : boolean
}
class CollabAPI {
+startCollaboration(socketId : SocketId) : void
+stopCollaboration() : void
+broadcastElements(elements : readonly ExcalidrawElement[]) : void
}
class LibraryAPI {
+importLibrary(items : LibraryItems_anyVersion | Blob) : Promise<void>
+getLibrary() : Promise<LibraryItems>
+updateLibrary(items : LibraryItems, opts : LibraryUpdateOptions) : Promise<void>
}
ExcalidrawImperativeAPI --> HistoryAPI : "contains"
ExcalidrawImperativeAPI --> CollabAPI : "contains"
ExcalidrawImperativeAPI --> LibraryAPI : "contains"
```

**Diagram sources**
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)

**Section sources**
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

## Usage Examples with React useRef

### Basic Ref Usage
```mermaid
flowchart TD
Start([Component mount]) --> CreateRef["Create ref with useRef"]
CreateRef --> RenderComponent["Render Excalidraw with excalidrawAPI prop"]
RenderComponent --> StoreAPI["Store API in ref.current"]
StoreAPI --> ReadyForUse["API ready for use"]
ReadyForUse --> HandleActions["Handle user actions"]
HandleActions --> CallMethods["Call imperative methods"]
CallMethods --> End([Interaction complete])
```

**Diagram sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

### Programmatic Element Update
```mermaid
flowchart TD
Start([User action]) --> AccessRef["Access excalidrawRef.current"]
AccessRef --> CheckAvailable{"API available?"}
CheckAvailable --> |No| WaitInit["Wait for initialization"]
CheckAvailable --> |Yes| PrepareData["Prepare scene data"]
PrepareData --> CallUpdate["Call updateScene method"]
CallUpdate --> SceneUpdated["Scene updated programmatically"]
SceneUpdated --> End([Update complete])
```

**Diagram sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [scene.ts](file://excalidraw/packages/excalidraw/scene/scene.ts)

**Section sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

## Integration with External State Management

### Redux Integration Pattern
```mermaid
flowchart LR
ReduxStore[Redux Store] < --> Middleware[Custom Middleware]
Middleware < --> ExcalidrawAPI[Excalidraw API]
ExcalidrawAPI < --> Canvas[Excalidraw Canvas]
Canvas --> |onChange| Middleware
Middleware --> |dispatch| ReduxStore
ReduxStore --> |subscribe| Middleware
Middleware --> |updateScene| ExcalidrawAPI
```

**Diagram sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

### Jotai Integration Pattern
```mermaid
flowchart LR
JotaiAtom[Jotai Atom] < --> SyncEffect[Synchronization Effect]
SyncEffect < --> ExcalidrawAPI[Excalidraw API]
ExcalidrawAPI < --> Canvas[Excalidraw Canvas]
Canvas --> |onChange| SyncEffect
SyncEffect --> |setAtom| JotaiAtom
JotaiAtom --> |useAtom| SyncEffect
SyncEffect --> |updateScene| ExcalidrawAPI
```

**Diagram sources**
- [appState.ts](file://excalidraw/packages/excalidraw/appState.ts)
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)

**Section sources**
- [appState.ts](file://excalidraw/packages/excalidraw/appState.ts)
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)

## Undo/Redo Implementation Patterns

### Built-in History Management
```mermaid
flowchart TD
Start([User action]) --> RecordState["Record current state"]
RecordState --> ModifyScene["Modify scene elements"]
ModifyScene --> PushHistory["Push to history stack"]
PushHistory --> EnableUndo["Enable undo button"]
EnableUndo --> UserUndo{"User clicks undo?"}
UserUndo --> |Yes| PopHistory["Pop from history stack"]
PopHistory --> RestoreState["Restore previous state"]
RestoreState --> UpdateUI["Update UI"]
UserUndo --> |No| Continue["Continue normal operation"]
Continue --> End([Operation complete])
```

**Diagram sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

**Section sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

## Common Issues and Solutions

### Method Availability During Initialization
A common issue occurs when attempting to call imperative methods before the Excalidraw component has fully initialized. The API is only available after the component mounts and the `excalidrawAPI` callback is invoked.

```mermaid
flowchart TD
Start([Component render]) --> Mount["Component mounts"]
Mount --> Callback["excalidrawAPI callback"]
Callback --> StoreAPI["Store API reference"]
StoreAPI --> Ready["API ready for use"]
Ready --> SafeCalls["Safe to call methods"]
SafeCalls --> End([Operation complete])
```

**Diagram sources**
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)

### TypeScript Typing Issues
Proper typing in TypeScript projects requires correct import of types and interface declaration. Common issues include missing type definitions and incorrect ref typing.

```mermaid
flowchart TD
Start([TypeScript project]) --> ImportTypes["Import Excalidraw types"]
ImportTypes --> DeclareRef["Declare ref with correct type"]
DeclareRef --> UseCallback["Use excalidrawAPI callback"]
UseCallback --> TypeGuard["Add type guards"]
TypeGuard --> SafeUsage["Safe typed usage"]
SafeUsage --> End([Typed implementation])
```

**Diagram sources**
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)

**Section sources**
- [types.ts](file://excalidraw/packages/excalidraw/types.ts#L0-L799)
- [index.tsx](file://excalidraw/packages/excalidraw/index.tsx#L0-L308)