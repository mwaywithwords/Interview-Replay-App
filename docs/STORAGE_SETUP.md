# Supabase Storage Setup: Replays Bucket

This document describes the setup and usage of the private `replays` storage bucket for interview recordings.

## Overview

The `replays` bucket is configured as a **private bucket** meaning:
- No public URLs are available
- All access requires authentication
- Files are accessed via **signed URLs** with time-limited access

## Storage Path Convention

Files are stored using the following path structure:

```
replays/{user_id}/{session_id}/audio.webm
```

Example:
```
replays/550e8400-e29b-41d4-a716-446655440000/7c9e6679-7425-40de-944b-e07fc1f90ae7/audio.webm
```

This structure ensures:
- Each user's files are isolated in their own folder
- Files are organized by recording session
- RLS policies can validate ownership using the path

## Setup Instructions

### 1. Run the Schema SQL

Execute the storage bucket creation and policies from `supabase/schema.sql` in the Supabase SQL Editor:

```sql
-- Create the private replays bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'replays',
    'replays',
    FALSE,  -- PRIVATE bucket
    52428800,  -- 50MB limit
    ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav']::text[]
);
```

### 2. Storage Policies

The following RLS policies are created:

| Policy | Operation | Description |
|--------|-----------|-------------|
| Users can upload to own folder | INSERT | Users can only upload to paths starting with their user_id |
| Users can update own files | UPDATE | Users can only modify files in their own folder |
| Users can read own files | SELECT | Users can only read files in their own folder |
| Users can delete own files | DELETE | Users can only delete files in their own folder |

### 3. Verify Setup

After running the SQL, verify in Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Confirm `replays` bucket exists
3. Check that `Public` is set to **OFF**
4. Go to **Policies** tab and verify all 4 policies exist

## Usage

### Uploading Files (Server-Side)

```typescript
import { uploadReplay } from '@/lib/supabase/storage';

// In a Server Action or API route
const { path, error } = await uploadReplay(
  userId,
  sessionId,
  audioFile,
  'audio.webm'
);
```

### Uploading Files (Client-Side)

```typescript
import { uploadReplayFromClient } from '@/lib/supabase/storage';

// In a Client Component (user must be authenticated)
const { path, error } = await uploadReplayFromClient(
  userId,
  sessionId,
  audioBlob,
  'audio.webm'
);
```

### Using Server Actions

```typescript
// Upload via form
import { uploadReplayAction } from '@/app/actions/storage';

const formData = new FormData();
formData.append('file', audioFile);
const { path, error } = await uploadReplayAction(sessionId, formData);
```

## Signed URLs for Playback

### Why Signed URLs?

Since the bucket is private, you cannot use public URLs. Instead, you generate **signed URLs** which:

1. Are cryptographically signed by Supabase
2. Expire after a specified time (default: 1 hour)
3. Can be used directly in `<audio>` or `<video>` elements
4. Don't require the client to be authenticated when accessing the URL

### Generating Signed URLs (Recommended Approach)

#### Option 1: Direct Function Call (Server Components/Actions)

```typescript
import { getSignedReplayUrl } from '@/lib/supabase/storage';

// In a Server Component or Server Action
const { url, error } = await getSignedReplayUrl(
  userId,
  sessionId,
  'audio.webm',
  3600  // Expires in 1 hour (3600 seconds)
);

// Use the URL in your component
<audio src={url} controls />
```

#### Option 2: Server Action (Called from Client Components)

```typescript
// In a Client Component
'use client';

import { getReplayPlaybackUrl } from '@/app/actions/storage';
import { useState, useEffect } from 'react';

function AudioPlayer({ sessionId }: { sessionId: string }) {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadUrl() {
      const { url, error } = await getReplayPlaybackUrl(sessionId);
      if (url) setPlaybackUrl(url);
    }
    loadUrl();
  }, [sessionId]);

  if (!playbackUrl) return <div>Loading...</div>;
  
  return <audio src={playbackUrl} controls />;
}
```

#### Option 3: API Route

```typescript
// app/api/replay/[sessionId]/url/route.ts
import { NextResponse } from 'next/server';
import { getSignedReplayUrl } from '@/lib/supabase/storage';
import { requireUser } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const user = await requireUser();
  
  const { url, error } = await getSignedReplayUrl(
    user.id,
    params.sessionId,
    'audio.webm',
    3600
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ url });
}
```

### Batch Signed URLs

For listing multiple sessions with playback URLs:

```typescript
import { getSignedReplayUrls, getReplayPath } from '@/lib/supabase/storage';

// Generate paths for multiple sessions
const paths = sessions.map(s => getReplayPath(userId, s.id));

// Get all signed URLs in one request
const { urls, error } = await getSignedReplayUrls(paths, 3600);
```

## Security Model

### How Path-Based Security Works

The RLS policies use `storage.foldername(name)` to extract path segments:

```sql
(storage.foldername(name))[1] = auth.uid()::text
```

This ensures:
- `[1]` extracts the first folder (user_id)
- Only files where the first folder matches the authenticated user's ID are accessible

### Attack Prevention

| Attack Vector | Protection |
|--------------|------------|
| User A uploads to User B's folder | INSERT policy rejects - path must start with auth.uid() |
| User A reads User B's files | SELECT policy rejects - can only read own folder |
| Direct public URL access | Bucket is private - returns 403 Forbidden |
| Expired signed URL | Supabase validates expiration - returns 400 Bad Request |
| Forged signed URL | Cryptographic signature validation fails |

### Additional Session Ownership Validation

For stricter security, you can enable the commented policy in `schema.sql` that validates the session belongs to the user:

```sql
CREATE POLICY "Users can upload to own sessions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM sessions
        WHERE sessions.id::text = (storage.foldername(name))[2]
        AND sessions.user_id = auth.uid()
    )
);
```

## Testing the Setup

### Test 1: Bucket is Private

```bash
# This should return 400 Bad Request or 403 Forbidden
curl "https://YOUR_PROJECT.supabase.co/storage/v1/object/public/replays/test.webm"
```

### Test 2: Authenticated Upload Works

```typescript
// Should succeed - user uploads to their own path
const { error } = await supabase.storage
  .from('replays')
  .upload(`${user.id}/${sessionId}/audio.webm`, file);
  
console.log(error); // Should be null
```

### Test 3: Cross-User Upload Fails

```typescript
// Should fail - user tries to upload to another user's path
const { error } = await supabase.storage
  .from('replays')
  .upload(`other-user-id/${sessionId}/audio.webm`, file);
  
console.log(error); // Should be policy violation error
```

### Test 4: Signed URL Works

```typescript
const { data } = await supabase.storage
  .from('replays')
  .createSignedUrl(`${user.id}/${sessionId}/audio.webm`, 3600);

// This URL should work in a browser for 1 hour
console.log(data.signedUrl);
```

## File Structure

```
lib/supabase/
├── client.ts      # Browser Supabase client
├── server.ts      # Server Supabase client + requireUser()
└── storage.ts     # Storage utilities (upload, signed URLs, delete)

app/actions/
└── storage.ts     # Server Actions for storage operations

supabase/
└── schema.sql     # Database schema + storage bucket + policies
```

## Troubleshooting

### "new row violates row-level security policy"

- The user is trying to access a path they don't own
- Verify the path starts with the authenticated user's ID

### "Bucket not found"

- Run the bucket creation SQL in Supabase Dashboard
- Check for typos in bucket name (should be `replays`)

### Signed URL returns 400

- The URL has expired
- Generate a new signed URL with a longer expiration

### Upload fails with "Invalid MIME type"

- The file type is not in the allowed list
- Allowed types: `audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/wav`
