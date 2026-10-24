import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <main>
      <h1>Welcome to Timely</h1>
      <p>Your time, thoughtfully planned.</p>
      <p>Timely helps you stay on track and time around the UCSC campus.</p>
      <p>Get started by uploading your schedule!</p>
      <Link to="/upload">
        <button>Take me to upload</button>
      </Link>
      
      <Link to="/map">
        <button>View Map</button>
      </Link>
    </main>
  )
}

export default HomePage
