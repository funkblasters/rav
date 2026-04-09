# Mock Server for Development

A lightweight GraphQL mock server for development without running the backend.

## Usage

From the `frontend` folder:

```bash
node mock-server.mjs
```

The server will start on `http://localhost:4001/graphql`.

## Connecting the Frontend

Set the GraphQL endpoint in development:

```bash
VITE_GRAPHQL_URL=http://localhost:4001/graphql npm run dev
```

Or add to a `.env.local` file:

```
VITE_GRAPHQL_URL=http://localhost:4001/graphql
```

## Mock Data

The server provides mock responses for:

- **Queries**: `me`, `users`, `events`, `flags`, `lastFlag`, `newsItems`, `headquartersNews`, `event`, `flag`
- **Mutations**: `login`, `register`, `createEvent`, `updateEvent`, `deleteEvent`, `addFlag`, `deleteFlag`

All responses use sample data (e.g., Italian flag as the last added flag, sample news articles).

## Customization

Edit `mock-server.mjs` to change:

- Mock data in the `mockUser`, `mockFlag`, `mockNewsItems`, `mockHqNews` objects
- Default port: set `MOCK_SERVER_PORT` env var (default: 4001)
- Response behavior: modify the resolver functions

## When Ready for Real Backend

Simply remove the `VITE_GRAPHQL_URL` env var or set it to `/graphql` and run:

```bash
npm run dev
```

The app will connect to `http://localhost:4000/graphql` (the actual backend).
