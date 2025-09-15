import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import Home from './Components/home/Home'
import '@fortawesome/fontawesome-free/css/all.min.css';
import ItemList from './Components/Bid/itemList/ItemList'
import ItemDetails from './Components/Bid/itemDetails/ItemDetails';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/items" element={<ItemList/>}/>
        <Route path="/items/:id" element={<ItemDetails/>}/>
      </Routes>
    </Router>
    
  )
}

export default App