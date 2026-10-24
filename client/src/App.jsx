
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import './App.css'
import UploadPage from './pages/UploadPage'

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/upload" element={<UploadPage />} />
    </Routes>
    </>
  )
}

export default App
