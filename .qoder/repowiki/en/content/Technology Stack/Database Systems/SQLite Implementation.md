# SQLite Implementation

<cite>
**Referenced Files in This Document**   
- [init-db.sql](file://excalidraw/init-db.sql)
- [db.ts](file://Backned/src/db.ts)
- [routes.ts](file://Backned/src/routes.ts)
- [server.ts](file://Backned/src/server.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Database Schema Design](#database-schema-design)
3. [Database Initialization Process](#database-initialization-process)
4. [Connection Handling and Query Execution](#connection-handling-and-query-execution)
5. [CRUD Operations for Scenes](#crud-operations-for-scenes)
6. [Transaction Usage and Error Handling](#transaction-usage-and-error-handling)
7. [Data Integrity Constraints](#data-integrity-constraints)
8. [Performance Considerations](#performance-considerations)
9. [Integration with Express.js Server](#integration-with-expressjs-server)
10. [Conclusion](#conclusion)

## Introduction
This document provides a comprehensive analysis of the SQLite implementation used in the Excalidraw backend. It covers the database schema design, initialization process, connection handling, query execution patterns, and integration with the Express.js server. The implementation supports persistence for collaborative drawing sessions through REST API endpoints, with specific focus on scenes, permalinks, and teacher management functionality.

**Section sources**
- [init-db.sql](file://excalidraw/init-db.sql#L1-L65)
- [db.ts](file://Backned/src/db.ts#L1-L96)

## Database Schema Design
The SQLite database schema consists of three core tables: scenes, permalinks, and teachers. The scenes table stores encrypted drawing data with room identifiers and cryptographic metadata. The permalinks table manages student access links with references to room information and optional student names. The teachers table maintains teacher accounts with authentication tokens for administrative access.

```mermaid
erDiagram
SCENES {
string room_id PK
integer scene_version
string iv
string ciphertext
datetime created_at
datetime updated_at
}
PERMALINKS {
string permalink PK
string room_id FK
string room_key
string student_name
string teacher_id FK
datetime created_at
datetime last_accessed
integer is_active
}
TEACHERS {
string teacher_id PK
string name
string email
string token UK
datetime created_at
datetime last_accessed
integer is_active
}
SCENES ||--o{ PERMALINKS : "has"
TEACHERS ||--o{ PERMALINKS : "manages"
```

**Diagram sources**
- [init-db.sql](file://excalidraw/init-db.sql#L1-L65)
- [db.ts](file://Backned/src/db.ts#L15-L41)

**Section sources**
- [init-db.sql](file://excalidraw/init-db.sql#L1-L65)
- [db.ts](file://Backned/src/db.ts#L15-L41)

## Database Initialization Process
The database initialization process creates all necessary tables and indexes when the application starts. The initDb function in db.ts handles this process, creating the scenes, permalinks, and teachers tables with appropriate columns and constraints. The initialization includes special handling for schema migrations, such as adding the teacher_id column to existing permalinks tables and managing index changes for improved data integrity.

```mermaid
flowchart TD
Start([Application Start]) --> InitDb["Call initDb()"]
InitDb --> CreateScenes["Create scenes table"]
CreateScenes --> CreatePermalinks["Create permalinks table"]
CreatePermalinks --> CreateTeachers["Create teachers table"]
CreateTeachers --> AddTeacherId["Attempt to add teacher_id column"]
AddTeacherId --> CreateIndexes["Create performance indexes"]
CreateIndexes --> DropLegacy["Drop legacy student_name index"]
DropLegacy --> CreateUnique["Create unique teacher+student index"]
CreateUnique --> Success["Initialization Complete"]
AddTeacherId --> |Error| Ignore["Ignore if column exists"]
Ignore --> CreateIndexes
```

**Diagram sources**
- [db.ts](file://Backned/src/db.ts#L15-L95)

**Section sources**
- [db.ts](file://Backned/src/db.ts#L15-L95)

## Connection Handling and Query Execution
The database connection is established using the sqlite3 module with configuration from environment variables. The implementation uses promisified versions of the database methods (dbRun, dbGet, dbAll) for asynchronous operations. Connection pooling is not explicitly implemented, relying on SQLite's built-in concurrency handling for the expected workload.

```mermaid
sequenceDiagram
participant App as "Application"
participant DB as "SQLite Database"
participant Conn as "Connection"
App->>DB : Create Database Instance
DB-->>Conn : Establish Connection
App->>Conn : Promisify Methods
Conn-->>App : Return db, dbRun, dbGet, dbAll
App->>Conn : Execute Queries
Conn-->>App : Return Results
```

**Diagram sources**
- [db.ts](file://Backned/src/db.ts#L1-L14)

**Section sources**
- [db.ts](file://Backned/src/db.ts#L1-L14)

## CRUD Operations for Scenes
Scene operations follow a standard CRUD pattern with specific implementations for insertion, retrieval, and deletion. Scenes are inserted or updated using the INSERT OR REPLACE statement to handle both create and update operations atomically. Retrieval operations use parameterized queries to prevent SQL injection, while deletion is handled through standard DELETE statements.

```mermaid
flowchart TD
subgraph "Scene Insert/Update"
A["POST /api/scenes/:roomId"] --> B["Validate Request Body"]
B --> C{"Valid?"}
C --> |No| D["Return 400 Error"]
C --> |Yes| E["Execute INSERT OR REPLACE"]
E --> F["Return Success"]
end
subgraph "Scene Retrieval"
G["GET /api/scenes/:roomId"] --> H["Execute SELECT Query"]
H --> I{"Found?"}
I --> |No| J["Return 404 Error"]
I --> |Yes| K["Return Scene Data"]
end
subgraph "Scene Deletion"
L["DELETE /api/scenes/:roomId"] --> M["Execute DELETE Statement"]
M --> N["Return Result"]
end
```

**Diagram sources**
- [routes.ts](file://Backned/src/routes.ts#L50-L75)

**Section sources**
- [routes.ts](file://Backned/src/routes.ts#L50-L75)

## Transaction Usage and Error Handling
The implementation uses implicit transactions for individual operations rather than explicit transaction blocks. Each database operation is wrapped in try-catch blocks to handle errors gracefully. The error handling strategy includes specific handling for constraint violations, particularly for the unique index on teacher-student combinations in permalinks.

```mermaid
flowchart TD
Start --> Try["Try Block"]
Try --> Operation["Database Operation"]
Operation --> Success["Return Success Response"]
Try --> |Error| Catch["Catch Block"]
Catch --> CheckError["Check Error Type"]
CheckError --> |Constraint Violation| HandleConstraint["Return Existing Permalink"]
CheckError --> |Other Error| LogError["Log Error"]
LogError --> ReturnError["Return 500 Response"]
```

**Diagram sources**
- [routes.ts](file://Backned/src/routes.ts#L65-L75)
- [routes.ts](file://Backned/src/routes.ts#L130-L165)

**Section sources**
- [routes.ts](file://Backned/src/routes.ts#L65-L75)
- [routes.ts](file://Backned/src/routes.ts#L130-L165)

## Data Integrity Constraints
The database enforces data integrity through primary keys, unique constraints, and conditional unique indexes. The scenes table uses room_id as a primary key to ensure single instance per room. The permalinks table has a composite unique constraint on teacher_id and student_name when both are present, preventing duplicate student names within a teacher's collection.

```mermaid
classDiagram
class Scenes {
+room_id : TEXT (PK)
+scene_version : INTEGER
+iv : TEXT
+ciphertext : TEXT
+created_at : DATETIME
+updated_at : DATETIME
}
class Permalinks {
+permalink : TEXT (PK)
+room_id : TEXT
+room_key : TEXT
+student_name : TEXT
+teacher_id : TEXT
+created_at : DATETIME
+last_accessed : DATETIME
+is_active : INTEGER
}
class Teachers {
+teacher_id : TEXT (PK)
+name : TEXT
+email : TEXT
+token : TEXT (UK)
+created_at : DATETIME
+last_accessed : DATETIME
+is_active : INTEGER
}
Permalinks --> Scenes : "references"
Permalinks --> Teachers : "references"
```

**Diagram sources**
- [db.ts](file://Backned/src/db.ts#L15-L41)
- [init-db.sql](file://excalidraw/init-db.sql#L1-L65)

**Section sources**
- [db.ts](file://Backned/src/db.ts#L15-L41)
- [init-db.sql](file://excalidraw/init-db.sql#L1-L65)

## Performance Considerations
The implementation includes several performance optimizations, primarily through strategic indexing. Indexes are created on frequently queried columns such as updated_at in the scenes table and room_id in the permalinks table. The conditional unique index on teacher_id and student_name improves lookup performance for active student links while maintaining data integrity.

```mermaid
flowchart TD
subgraph "Index Strategy"
A["idx_scenes_updated_at"] --> B["Cleanup Operations"]
C["idx_permalinks_room_id"] --> D["Room Resolution"]
D["idx_permalinks_teacher_id"] --> E["Teacher Queries"]
E["idx_permalinks_teacher_student"] --> F["Student Name Lookup"]
end
subgraph "Query Optimization"
G["Parameterized Queries"] --> H["Prevent SQL Injection"]
I["SELECT with WHERE"] --> J["Index Utilization"]
K["INSERT OR REPLACE"] --> L["Atomic Upsert"]
end
```

**Diagram sources**
- [db.ts](file://Backned/src/db.ts#L50-L65)

**Section sources**
- [db.ts](file://Backned/src/db.ts#L50-L65)

## Integration with Express.js Server
The SQLite database integrates with the Express.js server through a modular architecture. The database module exports connection and query methods that are used by the routes module to handle HTTP requests. The server initializes the database connection during startup and registers routes that interact with the database for persistence operations.

```mermaid
sequenceDiagram
participant Client as "HTTP Client"
participant Server as "Express Server"
participant Routes as "Routes Module"
participant DB as "Database Module"
Server->>Server : Load Environment
Server->>DB : Initialize Database
DB-->>Server : Export db, dbRun, etc.
Server->>Routes : Import Routes
Routes->>DB : Use Database Methods
Client->>Server : HTTP Request
Server->>Routes : Route Handling
Routes->>DB : Database Query
DB-->>Routes : Query Result
Routes-->>Server : Response
Server-->>Client : HTTP Response
```

**Diagram sources**
- [server.ts](file://Backned/src/server.ts#L1-L36)
- [routes.ts](file://Backned/src/routes.ts#L1-L365)

**Section sources**
- [server.ts](file://Backned/src/server.ts#L1-L36)
- [routes.ts](file://Backned/src/routes.ts#L1-L365)

## Conclusion
The SQLite implementation in the Excalidraw backend provides a robust persistence layer for collaborative drawing sessions. The schema design effectively supports the core requirements of scene storage, permalink management, and teacher administration. The initialization process handles schema creation and migration gracefully, while the query execution patterns ensure data integrity and performance. The integration with Express.js follows a clean separation of concerns, with well-defined interfaces between the database layer and API routes. This implementation balances simplicity with functionality, providing reliable persistence for the application's collaborative features.