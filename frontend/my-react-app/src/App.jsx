import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import Home from './Components/home/Home'
import '@fortawesome/fontawesome-free/css/all.min.css'
import ItemDetails from './Components/Bid/itemDetails/ItemDetails'
import Login from './Components/auth/Login'
import Signup from './Components/auth/Signup'
import ItemsList from './Components/Bid/itemList/ItemsList'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/items" element={<ItemsList/>}/>
        <Route path="/items/:id" element={<ItemDetails/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
      </Routes>
    </Router>
    
  )
}

export default App