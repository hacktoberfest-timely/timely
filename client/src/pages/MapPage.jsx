import { Link } from 'react-router-dom'

function MapPage() {
  return (
    <main>
      <h1>Map</h1>
      <p>Explore the map here.</p>
      <p>The map shows the locations of all buildings on campus.</p>
      <p>Look for the time slots and building locations.</p>
      <p>Time accuracy is not guaranteed.</p>
      <Link to="/">
        <button>Back to Home</button>
      </Link>
    </main>
  )
}

export default MapPage
