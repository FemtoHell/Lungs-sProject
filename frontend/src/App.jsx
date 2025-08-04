import { useState } from 'react'
import './App.css'
import Login from './Login'
import SignUp from './SignUp'

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  const switchToSignUp = () => {
    setCurrentPage('signup');
  };

  const switchToLogin = () => {
    setCurrentPage('login');
  };

  return (
    <div className="app">
      {currentPage === 'login' && <Login onSwitchToSignUp={switchToSignUp} />}
      {currentPage === 'signup' && <SignUp onSwitchToLogin={switchToLogin} />}
    </div>
  )
}

export default App