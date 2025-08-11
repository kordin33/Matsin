# Excalidraw Deployment on Railway

This guide explains how to deploy Excalidraw with PostgreSQL support on Railway.

## Prerequisites

1. Railway account
2. GitHub repository with this Excalidraw fork

## Deployment Steps

### 1. Create Railway Project

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your Excalidraw repository

### 2. Add PostgreSQL Database

1. In your Railway project dashboard
2. Click "+ New Service"
3. Select "Database" → "PostgreSQL"
4. Railway will automatically create a PostgreSQL instance

### 3. Configure Environment Variables

Railway will automatically set up the PostgreSQL connection variables. The following variables will be available:

- `DATABASE_URL`
- `PGHOST`
- `PGPORT` 
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

### 4. Initialize Database

After deployment, you need to initialize the database schema:

1. Go to your PostgreSQL service in Railway
2. Click "Connect" → "Query"
3. Copy and paste the contents of `init-db.sql`
4. Execute the SQL to create tables

### 5. Application Configuration

The application is configured to:

- Use PostgreSQL for persistent student rooms when `VITE_APP_PERSISTENT_ROOMS=true`
- Fall back to Firebase for temporary collaboration
- Store only essential data: permalinks and scene state

## Key Features

### PostgreSQL Integration

- **Scenes Table**: Stores encrypted scene data with versioning
- **Permalinks Table**: Manages student room links
- **Automatic Cleanup**: Timestamps for data management

### Cache Optimization

- Fixed cache mount format: `--mount=type=cache,id=<cache-id>`
- Yarn cache optimization for faster builds
- Node modules caching

### Environment Variables

```env
# Core Application
VITE_APP_PERSISTENT_ROOMS=true
VITE_APP_EDUCATIONAL_MODE=true

# PostgreSQL (Auto-configured by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
VITE_APP_DATABASE_URL=${{Postgres.DATABASE_URL}}

# Firebase (Fallback for temporary rooms)
VITE_APP_FIREBASE_CONFIG={...}
```

## Architecture

### Data Flow

1. **Student Permalinks**: Stored in PostgreSQL `permalinks` table
2. **Scene State**: Encrypted and stored in PostgreSQL `scenes` table
3. **Real-time Collaboration**: WebSocket peer-to-peer (bypasses database)
4. **File Storage**: Firebase Storage (for images/assets)

### Database Schema

```sql
-- Scenes: Encrypted scene data
scenes (
  room_id VARCHAR(255) UNIQUE,
  encrypted_data TEXT,
  version INTEGER,
  updated_at TIMESTAMP
)

-- Permalinks: Student room links
permalinks (
  permalink VARCHAR(255) UNIQUE,
  room_id VARCHAR(255),
  student_name VARCHAR(255),
  created_at TIMESTAMP
)
```

## Monitoring

- Railway provides built-in monitoring
- Health check endpoint: `http://localhost/`
- Database connection pooling with automatic reconnection

## Troubleshooting

### Common Issues

1. **Cache Mount Error**: Ensure Dockerfile uses `--mount=type=cache,id=<cache-id>`
2. **Database Connection**: Verify PostgreSQL service is running
3. **Environment Variables**: Check Railway auto-generated variables

### Logs

View logs in Railway dashboard:
- Application logs: Service → Logs
- Database logs: PostgreSQL service → Logs

## Security

- All scene data is encrypted before storage
- PostgreSQL connections use SSL in production
- Environment variables are securely managed by Railway
- No sensitive data in client-side code

## Performance

- Connection pooling for database efficiency
- Cached Docker builds for faster deployments
- CDN-ready static assets
- Automatic scaling with Railway