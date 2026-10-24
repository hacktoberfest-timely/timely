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

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000'

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

    if (
      !currentLocation.trim() ||
      !destination.trim() ||
      !classStart
    ) {
      setError('Please fill out all required fields.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(
        `${API_URL}/api/estimate-walk`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startLocation: currentLocation.trim(),
            destination: destination.trim(),
            classStart,
          }),
          signal: AbortSignal.timeout(60000),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Could not calculate walking time'
        )
      }

      if (!data.leaveAt || isNaN(new Date(data.leaveAt).getTime())) {
        throw new Error(
          'The backend did not return a valid departure time.'
        )
      }

      setResult(data)

    } catch (err) {
      if (
        err.name === 'TimeoutError' ||
        err.name === 'AbortError'
      ) {
        setError(
          'The calculation took too long. Please try again.'
        )
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles',
      }
    )
  }

  return (
    <main className="map-page">

      {/* Page Header */}
      <header className="map-header">
        <h1>Campus Map</h1>

        <p>
          Explore campus and find out when you should
          leave to get to class on time.
        </p>

        <p className="map-disclaimer">
          Walking times are estimates and may vary.
        </p>
      </header>

      {/* Interactive Campus Map */}
      <div className="map-container">
        <MapContainer
          center={[36.9914, -122.0609]}
          zoom={16}
          style={{
            height: '100%',
            width: '100%',
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[36.9914, -122.0609]}>
            <Popup>
              UC Santa Cruz campus area
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Walking Estimate Form */}
      <section className="walking-form">

        <h2>Personalize Your Walking Estimate</h2>

        <p className="form-description">
          Enter your information below to calculate
          your recommended departure time.
        </p>

        <form onSubmit={handleCalculate}>

          <div className="walking-form-grid">

            {/* Current Location */}
            <div className="form-field">
              <label htmlFor="currentLocation">
                Current Location
              </label>

              <input
                id="currentLocation"
                type="text"
                value={currentLocation}
                onChange={(e) =>
                  setCurrentLocation(e.target.value)
                }
                placeholder="e.g., Engineering 2"
                required
              />
            </div>

            {/* Destination */}
            <div className="form-field">
              <label htmlFor="destination">
                Destination
              </label>

              <input
                id="destination"
                type="text"
                value={destination}
                onChange={(e) =>
                  setDestination(e.target.value)
                }
                placeholder="e.g., McHenry Library"
                required
              />
            </div>

            {/* Class Start Time */}
            <div className="form-field">
              <label htmlFor="classStart">
                Class Start Time
              </label>

              <input
                id="classStart"
                type="time"
                value={classStart}
                onChange={(e) =>
                  setClassStart(e.target.value)
                }
                required
              />
            </div>

            {/* Height */}
            <div className="form-field">
              <label htmlFor="height">
                Height (cm)
              </label>

              <input
                id="height"
                type="number"
                min="1"
                step="1"
                value={height}
                onChange={(e) =>
                  setHeight(e.target.value)
                }
                placeholder="e.g., 170"
              />
            </div>

            {/* Walking Circumstances */}
            <div className="form-field full-width">
              <label htmlFor="circumstances">
                Walking Circumstances
              </label>

              <input
                id="circumstances"
                type="text"
                value={circumstances}
                onChange={(e) =>
                  setCircumstances(e.target.value)
                }
                placeholder="e.g., Using crutches, walking slowly, carrying a backpack"
              />
            </div>

          </div>

          {/* Calculate Button */}
          <button
            type="submit"
            className="calculate-button"
            disabled={loading}
          >
            {loading
              ? 'Calculating...'
              : 'Submit & Calculate'}
          </button>

        </form>
      </section>

      {/* Calculation Results */}
      <section className="results-section">

        <h2>Your Recommended Departure Time</h2>

        <div
          className="estimate-result"
          aria-live="polite"
          aria-busy={loading}
        >

          {/* Loading */}
          {loading && (
            <div className="loading-message">
              <div className="loading-spinner"></div>

              <p>
                Calculating your walking estimate...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="error-message" role="alert">
              <p>{error}</p>
            </div>
          )}

          {/* Successful Result */}
          {result && !loading && (
            <div className="departure-card">

              <p className="departure-label">
                You should leave at
              </p>

              <h3 className="departure-time">
                {formatTime(result.leaveAt)}
              </h3>

              <p className="departure-route">
                <strong>
                  {result.startLocation || currentLocation}
                </strong>

                <span className="route-arrow">
                  →
                </span>

                <strong>
                  {result.destination || destination}
                </strong>
              </p>

              {/* Walking Details */}
              <div className="time-details">

                <div className="time-detail">
                  <span>Walking Time</span>

                  <strong>
                    {result.estimatedWalkingMinutes} min
                  </strong>
                </div>

                <div className="time-detail">
                  <span>Safety Buffer</span>

                  <strong>
                    {result.bufferMinutes} min
                  </strong>
                </div>

                <div className="time-detail">
                  <span>Total Time</span>

                  <strong>
                    {result.totalMinutes} min
                  </strong>
                </div>

              </div>

              {/* Estimate Warning */}
              {result.estimateOnly && (
                <p className="estimate-warning">
                  This is an estimated departure time.
                  Actual walking times may vary.
                </p>
              )}

            </div>
          )}

          {/* Placeholder */}
          {!loading && !error && !result && (
            <div className="result-placeholder">
              <p>
                Your departure time will appear here.
              </p>

              <p>
                Fill out the form above and click
                Submit & Calculate.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* Home Button */}
      <div className="home-button-container">
        <Link to="/" className="home-button">
          Back to Home
        </Link>
      </div>

    </main>
  )
}

export default MapPage