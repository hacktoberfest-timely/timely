
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './MapPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function MapPage() {
  const [height, setHeight] = useState('')
  const [circumstances, setCircumstances] = useState('')
  const [currentLocation, setCurrentLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [classStart, setClassStart] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

async function handleCalculate(event) {
  event.preventDefault()

  setLoading(true)
  setError('')
  setResult(null)

  try {
    const response = await fetch(`${API_URL}/api/estimate-walk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startLocation: currentLocation,
        destination,
        classStart
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.error || 'Could not calculate walking time'
      )
    }

    setResult(data)

  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <main className="map-page">
      <h1>Map</h1>

      <p>Explore the map here.</p>
      <p>The map shows the locations of all buildings on campus.</p>
      <p>Look for the time slots and building locations.</p>
      <p>Time accuracy is not guaranteed.</p>

      {/* Interactive campus map */}
      <div className="map-container">
        <MapContainer
          center={[36.9914, -122.0609]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[36.9914, -122.0609]}>
            <Popup>UC Santa Cruz campus area</Popup>
          </Marker>
        </MapContainer>
      </div>

      <Link to="/">
        <button>Back to Home</button>
      </Link>

      {/* Estimated arrival and departure information */}
<h2 style={{ marginTop: '24px', marginBottom: '12px' }}>
  Your Estimated Walking Time
</h2>

<div
  className="estimate-result"
  aria-live="polite"
>
  {loading && (
    <p>Calculating your walking estimate...</p>
  )}

  {error && (
    <p role="alert" style={{ color: '#b91c1c' }}>
      {error}
    </p>
  )}

  {result && (
    <>
      <h3>Calculation Complete!</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </>
  )}

  {!loading && !error && !result && (
    <p>
      Enter your information and click
      Submit & Calculate to see your results.
    </p>
  )}
</div>

      {/* Personalization inputs */}
      <h2>Personalize Your Walking Estimate</h2>

      <label htmlFor="currentLocation">
        Current Location:
      </label>
      <input
        id="currentLocation"
        type="text"
        value={currentLocation}
        onChange={(e) => setCurrentLocation(e.target.value)}
        placeholder="Enter your current location"
      />

      <label htmlFor="destination">
  Destination:
</label>
<input
  id="destination"
  type="text"
  value={destination}
  onChange={(e) => setDestination(e.target.value)}
  placeholder="e.g., Baskin Engineering"
  required
/>

  <label htmlFor="classStart">
    Class Start Time:
  </label>
  <input
    id="classStart"
    type="time"
    value={classStart}
    onChange={(e) => setClassStart(e.target.value)}
    required
  />

      <label htmlFor="height">Height (cm):</label>
      <input
        id="height"
        type="number"
        min="1"
        step="1"
        value={height}
        onChange={(e) => setHeight(e.target.value)}
        placeholder="Height to the nearest integer in cm"
      />

      <label htmlFor="circumstances">
        Walking circumstances:
      </label>
      <input
        id="circumstances"
        type="text"
        value={circumstances}
        onChange={(e) => setCircumstances(e.target.value)}
        placeholder="e.g., carrying a backpack, walking slowly"
      />

      <button
  type="button"
  onClick={handleCalculate}
  disabled={
    loading ||
    !currentLocation.trim() ||
    !destination.trim() ||
    !classStart
  }
>
  {loading ? 'Calculating...' : 'Submit & Calculate'}
</button>

      {/* Display entered information */}
      <p>
        Current location: {currentLocation || 'Not entered'}
      </p>

      <p>
        Selected height: {height ? `${height} cm` : 'Not entered'}
      </p>

      <p>
        Circumstances: {circumstances || 'None entered'}
      </p>
    </main>
  )
}

export default MapPage
