import React from 'react'
import Navbar from "./components/Navbar/navbar"
import { Route, Routes } from 'react-router-dom'
import Home from "./pages/Home/Home"
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'

import Footer from './components/Footer/Footer'
import LoginPopup from './components/LoginPopup/LoginPopup'
import { useState } from 'react';
import Carts from './pages/Carts/Carts'


const App = () => {

  const [showLogin,setShowLogin] = useState(false)

  return (
    <>
    {showLogin?<LoginPopup setShowLogin={setShowLogin}/>:<></>}
    <div className='app'>
      <Navbar setShowLogin={setShowLogin}/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/cart' element={<Carts/>}></Route>
        <Route path='/order' element={<PlaceOrder/>}/>
      </Routes>
    </div>
    <Footer/>

    </>
  )
}

export default App
