import { Routes,Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Home from './pages/Home.jsx'

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/dashboard' element={<Dashboard/>} />
      </Routes>
    </>
  )
}

export default App
