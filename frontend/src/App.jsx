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
      
    </>
  )
}

export default App