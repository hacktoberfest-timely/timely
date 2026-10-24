import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './MapPage.css'

function MapPage() {
  return (
    <main className="map-page">
      <h1>Map</h1>
      <p>Explore the map here.</p>
      <p>The map shows the locations of all buildings on campus.</p>
      <p>Look for the time slots and building locations.</p>
      <p>Time accuracy is not guaranteed.</p>

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
    </main>
  )
}

export default MapPage