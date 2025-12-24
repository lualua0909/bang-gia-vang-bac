# Gia Bac - Silver Price Crawler

A Node.js backend service that crawls current silver prices from [giabac.vn](https://giabac.vn/).

## Features

- REST API endpoint to fetch silver prices
- HTML crawling using axios and cheerio
- In-memory caching with 60-second TTL
- Error handling and logging
- Price normalization (removes formatting characters)

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

Or with auto-reload (Node.js 18+):

```bash
npm run dev
```

The server will run on `http://localhost:3000`

## API Endpoints

### GET /api/silver-price

Fetches the current silver price from giabac.vn.

**Response:**

```json
{
  "source": "giabac.vn",
  "price": 12345678,
  "unit": "VND"
}
```

### GET /health

Health check endpoint.

### GET /

Root endpoint with API information.

## Project Structure

```
src/
  app.js                    # Express app setup
  routes/
    silver.js              # Silver price routes
  services/
    crawlSilverPrice.js   # Crawling service
```

## Technical Details

- Uses ExpressJS as the web framework
- Uses axios for HTTP requests
- Uses cheerio for DOM parsing
- Implements in-memory cache with 60-second TTL
- Handles network errors gracefully
- Returns cached data if crawl fails (if available)

## Notes

The price extraction logic uses multiple selector strategies to find the price on the website. If the website structure changes, you may need to update the selectors in `src/services/crawlSilverPrice.js`.
