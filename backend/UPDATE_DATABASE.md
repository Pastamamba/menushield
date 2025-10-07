# Add isActive field to existing dishes in MongoDB

This script adds the missing `isActive` field to existing dishes in the production MongoDB database.

## Usage

For production (Netlify), add this as a build command or run manually:

```bash
node update-database.js
```

## What it does

1. Connects to the MongoDB database
2. Finds all dishes that don't have the `isActive` field
3. Sets `isActive: true` for all existing dishes
4. Ensures new toggle functionality works properly

## Environment Variables Required

- `DATABASE_URL`: MongoDB connection string
- `NODE_ENV`: Should be "production" for live database