import { useState } from 'react'
import './App.css'
import Login from './Login'
import RegisterWithRecaptchaV3 from './RegisterWithRecaptchaV3'

function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login' hoặc 'register'

  return (
    <>
      {currentPage === 'login' && <Login />}
      {currentPage === 'register' && <RegisterWithRecaptchaV3 />}
      
      {/* Navigation buttons cho demo */}
      <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}>
        <button onClick={() => setCurrentPage('login')}>Login</button>
        <button onClick={() => setCurrentPage('register')}>Register</button>
      </div>
    </>
  )
}

export default App