
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

function MapPage() {
  const [height, setHeight] = useState('')
  const [circumstances, setCircumstances] = useState('')
  const [currentLocation, setCurrentLocation] = useState('')

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

      {/* Estimated arrival time placeholder */}
      <h2 style={{ marginTop: '24px', marginBottom: '12px' }}>
        Your Estimated Time of Arrival:
      </h2>

      <div
        style={{
          width: '90%',
          maxWidth: '700px',
          minHeight: '180px',
          margin: '0 auto 32px',
          padding: '20px',
          boxSizing: 'border-box',
          backgroundColor: '#f8faf6',
          border: '2px solid #b4c9b0',
          borderRadius: '12px',
        }}
      />

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
