# Environment Configuration

<cite>
**Referenced Files in This Document**   
- [railway.toml](file://railway.toml#L0-L32)
- [Backned/src/db.ts](file://Backned/src/db.ts#L0-L96)
- [Backned/src/server.ts](file://Backned/src/server.ts#L0-L36)
- [excalidraw-app/data/postgresql.ts](file://excalidraw/excalidraw-app/data/postgresql.ts#L33-L70)
- [excalidraw-app/data/firebase.ts](file://excalidraw/excalidraw-app/data/firebase.ts#L40-L95)
- [excalidraw-app/vite-env.d.ts](file://excalidraw/excalidraw-app/vite-env.d.ts#L0-L48)
- [excalidraw-app/data/api-client.ts](file://excalidraw/excalidraw-app/data/api-client.ts#L70-L123)
- [firebase-project/firebase.json](file://excalidraw/firebase-project/firebase.json#L0-L8)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Environment Variables](#environment-variables)
3. [Database Configuration](#database-configuration)
4. [Authentication and Security Settings](#authentication-and-security-settings)
5. [Firebase Integration](#firebase-integration)
6. [Persistence Layer Configuration](#persistence-layer-configuration)
7. [Development, Staging, and Production Examples](#development-staging-and-production-examples)
8. [Troubleshooting and Validation](#troubleshooting-and-validation)

## Introduction
This document provides comprehensive guidance on configuring the Excalidraw collaborative whiteboard application environment. It covers all essential configuration aspects including environment variables, database setup for both SQLite and PostgreSQL, authentication mechanisms, Firebase integration, and persistence layers. The configuration enables collaborative features, secure data storage, and scalable deployment across different environments.

## Environment Variables
The Excalidraw application utilizes Vite-based environment variables prefixed with `VITE_APP_` for client-side configuration. These variables control core application behavior, API connections, and feature flags.

**Core Application Variables**
- `VITE_APP_PORT`: Development server port (default: 3000)
- `VITE_APP_BACKEND_V2_GET_URL`: Backend URL for retrieving scenes
- `VITE_APP_BACKEND_V2_POST_URL`: Backend URL for saving scenes
- `VITE_APP_WS_SERVER_URL`: WebSocket server URL for real-time collaboration
- `VITE_APP_PORTAL_URL`: Portal URL for collaboration workflow
- `VITE_APP_AI_BACKEND`: AI service backend endpoint

**Feature Flags**
- `VITE_APP_PERSISTENT_ROOMS`: Enables persistent room storage (boolean)
- `VITE_APP_EDUCATIONAL_MODE`: Activates educational features (boolean)
- `VITE_APP_DEBUG`: Enables debug mode and logging (boolean)
- `VITE_APP_COLLAPSE_OVERLAY`: Controls overlay visibility on startup
- `VITE_APP_DISABLE_SENTRY`: Disables Sentry error tracking
- `VITE_APP_ENABLE_ESLINT`: Enables ESLint in development
- `VITE_APP_ENABLE_PWA`: Enables Progressive Web App features

**Security and Integration**
- `VITE_APP_FIREBASE_CONFIG`: JSON string containing Firebase configuration
- `VITE_APP_AI_BACKEND`: Endpoint for AI-powered features
- `VITE_APP_GIT_SHA`: Git commit SHA for version tracking

**Development Settings**
- `VITE_APP_DEV_DISABLE_LIVE_RELOAD`: Disables hot module replacement
- `MODE`: Current environment mode (development, production)
- `DEV`: Development mode flag
- `PROD`: Production mode flag

**Section sources**
- [excalidraw-app/vite-env.d.ts](file://excalidraw/excalidraw-app/vite-env.d.ts#L0-L48)
- [railway.toml](file://railway.toml#L0-L32)

## Database Configuration
Excalidraw supports multiple database backends for persistence, with configuration options for both SQLite and PostgreSQL systems.

### SQLite Configuration
The "Backned" service provides SQLite-based persistence with the following configuration:

- **DATABASE_PATH**: File system path for the SQLite database (default: `./excalidraw.db`)
- **Connection**: Direct file-based database connection
- **Tables**: 
  - `scenes`: Stores encrypted scene data with room_id as primary key
  - `permalinks`: Manages shared links with teacher-student relationships
  - `teachers`: Stores educator accounts and authentication tokens

The SQLite database is initialized automatically with appropriate indexes and constraints, including unique indexes for teacher-student combinations and timestamps for scene updates.

### PostgreSQL Configuration
For PostgreSQL integration, the application uses environment variables to establish connections:

- **VITE_APP_DATABASE_URL**: Full PostgreSQL connection string
- **VITE_APP_POSTGRES_HOST**: Database host (default: localhost)
- **VITE_APP_POSTGRES_PORT**: Database port (default: 5432)
- **VITE_APP_POSTGRES_DATABASE**: Database name (default: excalidraw)
- **VITE_APP_POSTGRES_USER**: Database username (default: postgres)
- **VITE_APP_POSTGRES_PASSWORD**: Database password (default: password)
- **SSL Configuration**: SSL enabled in production with `rejectUnauthorized: false`

The PostgreSQL client automatically creates necessary tables and indexes:
- `scenes` table with room_id as primary key and updated_at timestamp
- Index on updated_at for efficient querying
- Proper data types including VARCHAR, INTEGER, TEXT, and TIMESTAMP

**Section sources**
- [Backned/src/db.ts](file://Backned/src/db.ts#L0-L96)
- [excalidraw-app/data/postgresql.ts](file://excalidraw/excalidraw-app/data/postgresql.ts#L33-L70)

## Authentication and Security Settings
The application implements multiple security layers for data protection and user authentication.

### End-to-End Encryption
All scene data is encrypted client-side before storage using:
- AES-GCM encryption with unique initialization vectors (IV)
- Room-specific encryption keys
- Encrypted ciphertext stored in database
- Client-side decryption using room keys

### API Security
The backend API implements several security measures:
- CORS configuration via `CORS_ORIGIN` environment variable
- Support for multiple origins via comma-separated list
- Credential support for authenticated requests
- Token-based authentication for teacher endpoints
- Input validation and error handling

### Environment Security
Security-related environment variables include:
- `NODE_ENV`: Node.js environment (production, development)
- `VITE_APP_DEBUG`: Debug mode toggle affecting logging
- `VITE_APP_DISABLE_SENTRY`: Error tracking control
- Proper isolation of sensitive credentials in environment variables

**Section sources**
- [Backned/src/server.ts](file://Backned/src/server.ts#L0-L36)
- [excalidraw-app/data/api-client.ts](file://excalidraw/excalidraw-app/data/api-client.ts#L70-L123)

## Firebase Integration
Firebase provides alternative persistence and authentication capabilities for the application.

### Firebase Configuration
The Firebase integration is controlled by:
- `VITE_APP_FIREBASE_CONFIG`: JSON string containing Firebase configuration
- Automatic parsing with error handling and fallback to empty configuration
- Conditional activation based on presence of apiKey or storageBucket

The configuration object must include standard Firebase parameters:
- `apiKey`: Firebase project API key
- `authDomain`: Authentication domain
- `projectId`: Firebase project ID
- `storageBucket`: Cloud Storage bucket
- `messagingSenderId`: Cloud Messaging sender ID
- `appId`: Firebase application ID

### Firebase Services
When enabled, Firebase provides:
- Firestore database for scene storage in "scenes" collection
- Firebase Storage for file attachments
- Real-time synchronization capabilities
- Authentication integration

The application automatically initializes Firebase services and handles connection lifecycle management, with proper error handling for configuration parsing issues.

**Section sources**
- [excalidraw-app/data/firebase.ts](file://excalidraw/excalidraw-app/data/firebase.ts#L40-L95)
- [firebase-project/firebase.json](file://excalidraw/firebase-project/firebase.json#L0-L8)

## Persistence Layer Configuration
The application supports multiple persistence strategies for collaborative features.

### Multi-Backend Architecture
Excalidraw implements a hybrid persistence model:
- **SQLite Backend**: "Backned" service providing REST API at `/api/scenes` and `/api/permalinks`
- **PostgreSQL Client**: Direct database access from client code (Node.js environment only)
- **Firebase**: Cloud-based persistence option
- **REST API Client**: Standard HTTP interface for scene operations

### Data Models
All persistence layers use consistent data models:
- **Scenes**: room_id, scene_version, iv (initialization vector), ciphertext
- **Permalinks**: permalink, room_id, room_key, student_name, teacher_id
- **Teachers**: teacher_id, name, email, token, authentication data

### Synchronization Strategy
The application handles data synchronization through:
- Scene version tracking
- WeakMap-based caching of scene versions per socket connection
- Transactional updates to prevent race conditions
- Automatic index creation for performance optimization

**Section sources**
- [excalidraw-app/data/postgresql.ts](file://excalidraw/excalidraw-app/data/postgresql.ts#L199-L256)
- [Backned/src/db.ts](file://Backned/src/db.ts#L0-L96)

## Development, Staging, and Production Examples
This section provides configuration examples for different deployment environments.

### Development Environment
```env
# Development settings
NODE_ENV=development
VITE_APP_PORT=3000
VITE_APP_BACKEND_V2_GET_URL=http://localhost:3005
VITE_APP_BACKEND_V2_POST_URL=http://localhost:3005
VITE_APP_WS_SERVER_URL=http://localhost:3002
CORS_ORIGIN=http://localhost:3000
VITE_APP_DEBUG=true
VITE_APP_DISABLE_SENTRY=true
VITE_APP_PERSISTENT_ROOMS=false
DATABASE_PATH=./dev-excalidraw.db
```

### Staging Environment
```env
# Staging settings
NODE_ENV=staging
VITE_APP_BACKEND_V2_GET_URL=https://staging-api.example.com
VITE_APP_BACKEND_V2_POST_URL=https://staging-api.example.com
VITE_APP_WS_SERVER_URL=wss://staging-ws.example.com
VITE_APP_PERSISTENT_ROOMS=true
VITE_APP_EDUCATIONAL_MODE=true
VITE_APP_DEBUG=false
VITE_APP_DISABLE_SENTRY=false
POSTGRES_HOST=staging-db.example.com
POSTGRES_DATABASE=excalidraw_staging
POSTGRES_USER=excalidraw
CORS_ORIGIN=https://staging.excalidraw.com
```

### Production Environment (Railway)
```env
# Production settings from railway.toml
NODE_ENV=production
VITE_APP_PERSISTENT_ROOMS=true
VITE_APP_EDUCATIONAL_MODE=true
VITE_APP_DEBUG=false
RAILWAY_WEBSOCKET_URL=${{websocket.RAILWAY_PUBLIC_DOMAIN}}
# PostgreSQL automatically provisioned by Railway
# WebSocket service running on port 3002
# Nginx serving static assets
```

### Railway Deployment Configuration
The `railway.toml` file defines the production deployment:
- Docker-based build using `Dockerfile`
- Nginx as the production server
- Automatic PostgreSQL provisioning (version 15)
- WebSocket service on port 3002
- Environment-specific variables for production
- Restart policy with failure tolerance

**Section sources**
- [railway.toml](file://railway.toml#L0-L32)
- [Backned/src/server.ts](file://Backned/src/server.ts#L0-L36)

## Troubleshooting and Validation
This section addresses common configuration issues and validation techniques.

### Common Configuration Errors
1. **CORS Issues**: Ensure `CORS_ORIGIN` matches the UI origin, especially when running on non-standard ports
2. **Database Connection Failures**: Verify PostgreSQL credentials and network accessibility
3. **Firebase Configuration**: Ensure `VITE_APP_FIREBASE_CONFIG` is a valid JSON string
4. **WebSocket Connectivity**: Confirm WebSocket server is running and accessible
5. **Environment Variable Prefixing**: All client-side variables must use `VITE_APP_` prefix

### Validation Techniques
- **Health Checks**: Use the `/health` endpoint to verify backend connectivity
- **Configuration Testing**: Start services individually and verify logs
- **Environment Verification**: Use `console.log` statements during development to confirm variable values
- **Database Initialization**: Check that tables and indexes are created successfully
- **Connection Testing**: Verify database connections with simple queries

### Debugging Strategies
1. Enable `VITE_APP_DEBUG=true` for detailed client-side logging
2. Check server startup logs for database initialization messages
3. Verify environment variable loading with `console.log` of configuration objects
4. Test API endpoints directly using curl or Postman
5. Monitor browser developer tools for network errors and CORS issues

### Known Limitations
- PostgreSQL client code only works in Node.js environments, not browsers
- Firebase configuration requires proper JSON formatting
- The REST API and direct PostgreSQL access represent duplicated backend functionality
- Nginx configuration does not include proxy rules for WebSocket or API endpoints

**Section sources**
- [issue.md](file://issue.md#L38-L67)
- [Backned/src/server.ts](file://Backned/src/server.ts#L0-L36)
- [excalidraw-app/data/postgresql.ts](file://excalidraw/excalidraw-app/data/postgresql.ts#L33-L70)