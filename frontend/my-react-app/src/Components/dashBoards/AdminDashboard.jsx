import React, { useState, useEffect } from "react";
import OrdersTable from '../admin/OrdersTable';
import InventoryList from '../inventory/InventoryList';
import './AdminDashboard.css';
import Market from '../admin/Market';
import PaymentHistoryChart from '../admin/PaymentHistoryChart';
import AddEmployeeModal from '../admin/AddEmployeeModal';
import AddAttendanceModal from '../admin/AddAttendanceModal';
import SalarySlipModal from '../admin/SalarySlipModal';
import axios from 'axios';
import Finance from '../admin/Finance';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddAttendance, setShowAddAttendance] = useState(false);
  const [showSalarySlip, setShowSalarySlip] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeesError, setEmployeesError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Finance summary state
  const [financeSummary, setFinanceSummary] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    totalExpenses: 0
  });
  const [loadingFinance, setLoadingFinance] = useState(false);



  // Fetch finance summary from Market entries
  const fetchFinanceSummary = async () => {
    try {
      setLoadingFinance(true);
      const res = await axios.get('http://localhost:5000/api/finance/market');
      const entries = res.data || [];



      // Calculate totals
      const totalTransactions = entries.length;
      const totalRevenue = entries
        .filter(entry => entry.entryType === 'income')
        .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
      const totalExpenses = entries
        .filter(entry => entry.entryType === 'expense')
        .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

      setFinanceSummary({
        totalTransactions,
        totalRevenue,
        totalExpenses
      });
    } catch (e) {
      console.error('Failed to fetch finance summary:', e);
      setFinanceSummary({
        totalTransactions: 0,
        totalRevenue: 0,
        totalExpenses: 0
      });
    } finally {
      setLoadingFinance(false);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      if (activeTab !== 'users') return;
      try {
        setLoadingEmployees(true);
        setEmployeesError('');
        const res = await axios.get('http://localhost:5000/api/employees');
        setEmployees(res.data || []);
      } catch (e) {
        setEmployees([]);
        setEmployeesError(e?.response?.data?.error || e.message || 'Failed to load employees');
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [activeTab]);

  // Fetch finance summary when finance tab is active
  useEffect(() => {
    if (activeTab === 'finance') {
      fetchFinanceSummary();
    }
  }, [activeTab]);


  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'orders', label: 'Orders' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'users', label: 'Users' },

    { id: 'finance', label: 'Finance' }
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
            <OrdersTable />
          </div>
        );
      case 'inventory':
        return (
          <div className="inventory-wrapper">
            <InventoryList />
          </div>
        );
      case 'users':
        return (
          <div className="admin-content">
            <h2 className="admin-content-title">Users</h2>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <button className="btn primary" onClick={() => setShowAddEmployee(true)}>+ Add Employee</button>
              <button className="btn secondary" onClick={() => setShowAddAttendance(true)}>+ Add Attendance</button>
            </div>

            {/* Employees Table */}
            <div>
              {loadingEmployees ? (
                <div>Loading employees...</div>
              ) : employeesError ? (
                <div className="error-text">{employeesError}</div>
              ) : employees.length === 0 ? (
                <div className="admin-content-message">No employees found.</div>
              ) : (
                <div className="table-container">
                  <table className="entries-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Full Name</th>
                        <th>NIC</th>
                        <th>Basic Salary</th>
                        <th>Allowances</th>
                        <th>Status</th>
                        <th>Bank</th>
                        <th>Loan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={emp._id}>
                          <td>{emp.employeeId}</td>
                          <td>{emp.fullName}</td>
                          <td>{emp.nic || 'N/A'}</td>
                          <td>Rs. {Number(emp.basicSalary || 0).toFixed(2)}</td>
                          <td>Rs. {Number(emp.allowances || 0).toFixed(2)}</td>
                          <td>{emp.status}</td>
                          <td>{emp.bank?.name ? `${emp.bank.name} (${emp.bank.account || ''})` : 'N/A'}</td>
                          <td>{emp.loan?.amount ? `Rs. ${Number(emp.loan.amount).toFixed(2)} / ${emp.loan.monthlyDeduction ? `Rs. ${Number(emp.loan.monthlyDeduction).toFixed(2)}` : ''}` : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'finance':
        return (
          <div className="inventory-wrapper">
            <Finance />
           </div>
        );
      default:
        return (
          <div className="admin-content">
            <h2 className="admin-content-title">Dashboard</h2>
            <p className="admin-content-message">Welcome to the admin dashboard.</p>
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
      <div className="admin-main">
        {renderContent()}
        <AddEmployeeModal
          open={showAddEmployee}
          onClose={() => setShowAddEmployee(false)}
          onSave={(data) => {
            setShowAddEmployee(false);
            // optionally handle saved employee
            console.log('Employee saved', data);
          }}
        />

        <AddAttendanceModal
          open={showAddAttendance}
          onClose={() => setShowAddAttendance(false)}
          onSaved={(data) => {
            setShowAddAttendance(false);
            // optionally handle saved attendance
            console.log('Attendance saved', data);
          }}
        />




        <SalarySlipModal
          open={showSalarySlip}
          onClose={() => setShowSalarySlip(false)}
        />



      </div>


    </div>
  );
};

export default AdminDashboard;