# Lifelines Backend

Express.js API server with Supabase for disaster reporting.

## Setup

1. Create a Supabase project at https://supabase.com
2. Copy `.env.example` to `.env` and fill in your credentials
3. Run the SQL schema (see below)
4. Install dependencies: `npm install`
5. Start server: `npm run dev`

## Supabase Setup

### 1. Create Storage Bucket

In Supabase dashboard → Storage → Create bucket:
- Name: `report-images`
- Public: Yes

### 2. Run SQL Schema

```sql
-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('rubble', 'hazard', 'blocked_road')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  image_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on zone for faster queries
CREATE INDEX idx_reports_zone ON reports(zone);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_timestamp ON reports(timestamp DESC);
```

### 3. Get Credentials

- Go to Project Settings → API
- Copy `Project URL` → paste in `.env` as `SUPABASE_URL`
- Copy `anon` `public` key → paste in `.env` as `SUPABASE_ANON_KEY`

## API Endpoints

### POST /api/reports
Create new report
```json
{
  "zone": "Gaza City",
  "category": "rubble",
  "latitude": 31.5,
  "longitude": 34.46,
  "description": "Large pile of rubble blocking road",
  "imageBase64": "base64-encoded-string",
  "timestamp": 1234567890000
}
```

### GET /api/reports
Get all reports (supports filters: ?zone=Gaza&category=rubble&status=pending)

### GET /api/reports/:id
Get single report

### PATCH /api/reports/:id
Update report status
```json
{
  "status": "verified"
}
```

## Development

```bash
npm run dev  # Start with nodemon (auto-reload)
npm start    # Production start
```

Server runs on http://localhost:3001
