import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import Home from './Components/home/Home'
import '@fortawesome/fontawesome-free/css/all.min.css'
import ItemDetails from './Components/Bid/itemDetails/ItemDetails'
import ItemsList from './Components/Bid/itemList/ItemsList'
import BidHistory from './Components/Bid/bidHistory/BidHistory'
import BuyerLogin from './Components/login/BuyerLogin'
import SellerLogin from './Components/login/SellerLogin'
import BuyerRegister from './Components/buyerRegister/BuyerRegister'
import SellerRegister from './Components/sellerRegister/SellerRegister'
import BuyerDashboard from './Components/dashBoards/BuyerDashboard'
import SellerDashboard from './Components/dashBoards/SellerDashboard'
import AdminDashboard from './Components/dashBoards/AdminDashboard'
import AddFishLot from './Components/fishLot/AddFishLot'
import InventoryList from './Components/inventory/InventoryList'
import ProductGrid from './Components/inventory/ProductGrid'
import SellerInventory from './Components/seller/SellerInventory'
import Shop from './Components/shop/Shop'
import Orders from './Components/orders/Orders'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/items" element={<ItemsList/>}/>
        <Route path="/items/:id" element={<ItemDetails/>}/>
        <Route path="/buyerlogin" element={<BuyerLogin/>}/>
        <Route path="/sellerlogin" element={<SellerLogin/>}/>
        <Route path="/buyerregister" element={<BuyerRegister/>}/>
        <Route path="/sellerregister" element={<SellerRegister/>}/>
        <Route path="/bdashboard" element={<BuyerDashboard/>}/>
        <Route path="/sdashboard" element={<SellerDashboard/>}/>
        <Route path="/bidHistory/:id" element={<BidHistory/>}/>
        <Route path="/admin" element={<AdminDashboard/>}/>
        <Route path="/add-fish-lot" element={<AddFishLot/>}/>
        <Route path="/inventory" element={<InventoryList/>}/>
        <Route path="/products" element={<ProductGrid/>}/>
        <Route path="/seller-inventory" element={<SellerInventory/>}/>
        <Route path="/shop" element={<Shop/>}/>
        <Route path="/orders" element={<Orders/>}/>
      </Routes>
    </Router>
  )
}

export default App