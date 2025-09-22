import React, { useState } from "react";
import './AdminDashboard.css';
import InventoryList from '../inventory/InventoryList';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'Orders' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'bids', label: 'Bids' },
    { id: 'users', label: 'Users' },
    { id: 'reports', label: 'Reports' },
    { id: 'market', label: 'Market' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="admin-content">
            <h2 className="admin-content-title">Dashboard</h2>
            <p className="admin-content-message">Welcome to the admin dashboard.</p>
          </div>
        );
      case 'orders':
        return (
          <div className="admin-content">
            <h2 className="admin-content-title">Orders</h2>
            <p className="admin-content-message">No orders yet.</p>
          </div>
        );
      case 'inventory':
        return (
          <div className="inventory-wrapper">
            <InventoryList />
          </div>
        );
      case 'bids':
        return (
          <div className="bids-wrapper">
            <BidManagement />
          </div>
        );
      case 'users':
        return (
          <div className="admin-content">
            <h2 className="admin-content-title">Users</h2>
            <p className="admin-content-message">No employees yet.</p>
          </div>
        );
      case 'reports':
        return (
          <div className="admin-content">
            <h2 className="admin-content-title">Reports</h2>
            <p className="admin-content-message">No reports yet.</p>
          </div>
        );
      case 'market':
        return (
          <div className="admin-content">
            <h2 className="admin-content-title">Market</h2>
            <p className="admin-content-message">No market data yet.</p>
          </div>
        );
      default:
        return (
          <div className="admin-content">
            <h2 className="admin-content-title">Inventory</h2>
            <p className="admin-content-message"> Inventories.</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar Navigation */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1 className="admin-sidebar-title">Admin</h1>
        </div>
        <nav className="admin-sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className={`admin-main ${activeTab === 'inventory' ? 'inventory-active' : ''} ${activeTab === 'bids' ? 'bids-active' : ''}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;