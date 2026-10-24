# ⏰ Timely

### Your time, thoughtfully planned.

**Timely** is an AI-powered walking-time and departure reminder application designed specifically for students at the **University of California, Santa Cruz (UCSC)**.

Powered by **Gemma 4**, Timely helps students estimate how long it will take to walk across UCSC's hilly campus and determine when they should leave to arrive on time.

## Inspiration

UCSC's large campus, steep hills, and spread-out academic buildings make it difficult for students to estimate how long they need to walk between locations.

Timely was created to answer one simple question:

**"When should I leave to get there on time?"**

## Features

- **UCSC-Focused Destinations:** Supports destinations across the UCSC campus.
- **Gemma 4 Walking Estimates:** Uses an open-weight AI model to estimate walking time based on starting location and destination.
- **Personalized Context:** Accepts height in centimeters and optional circumstances, such as walking slowly.
- **Departure-Time Calculation:** Uses the user's desired arrival time, estimated walking duration, and an additional buffer.
- **Campus Map Interface:** Provides a UCSC-focused map experience.

AI estimates are approximate and do not represent verified pedestrian routes.

## How Gemma 4 Works

Timely uses **Gemma 4** through Google's Gemini API.

The application sends the student's location, destination, and relevant walking preferences to an Express backend. The backend requests a walking-time estimate from Gemma 4.

The backend then calculates:

```text
Recommended Departure Time
    = Desired Arrival Time
    - Estimated Walking Time
    - Safety Buffer
```

The AI model does not receive a live pedestrian routing map, so distances and walking durations should be treated as estimates.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend |
| Vite | Development environment |
| React Router | Page navigation |
| Node.js + Express | Backend REST API |
| Gemma 4 | AI walking-time estimation |
| Google GenAI SDK | AI integration |
| PostgreSQL | Database |
| Render | Backend and database hosting |
| Luxon | Date and time calculations |
| Browser Geolocation API | GPS location |