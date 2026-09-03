import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import TopNav from './components/TopNav'
import Overview from './pages/Overview'
import Tagging from './pages/Tagging'
import Review from './pages/Review'
import Search from './pages/Search'
import Personas from './pages/Personas'
import Metrics from './pages/Metrics'

function App() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <Router>
      <div className="min-h-screen bg-stone-100 dark:bg-slate-950">
        <TopNav darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="max-w-[1400px] mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/tagging" element={<Tagging />} />
            <Route path="/review" element={<Review />} />
            <Route path="/search" element={<Search />} />
            <Route path="/personas" element={<Personas />} />
            <Route path="/metrics" element={<Metrics />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
