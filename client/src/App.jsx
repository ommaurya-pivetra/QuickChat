
import './App.css'
import bgImage from './assets/bgImage.svg'
import {Routes,Route, Navigate} from 'react-router-dom'
import Homepage from './pages/Homepage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import {Toaster} from 'react-hot-toast'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

function App() {
  const {authUser}=useContext(AuthContext);
  return (
   <div className=" bg-contain" style={{ backgroundImage: `url(${bgImage})` }}>
    <Toaster />
    <Routes>  
      <Route path='/' element={authUser? <Homepage/>:<Navigate to ='/login'/>}/>
      <Route path='/Login' element={!authUser ? <LoginPage/>:<Navigate to='/'/>}/>
      <Route path='/Profile' element={authUser ?<ProfilePage/>: <Navigate to='/login'/>}/>
    </Routes>
   </div>
  )
}

export default App
