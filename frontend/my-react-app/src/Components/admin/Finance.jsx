import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PaymentHistoryChart from './PaymentHistoryChart';
import Market from './Market';
import SalarySlipModal from './SalarySlipModal';
import './AdminDashboard.css';

const Finance = () => {
    const [financeSummary, setFinanceSummary] = useState({
        totalTransactions: 0,
        totalRevenue: 0,
        totalExpenses: 0
    });
    const [loadingFinance, setLoadingFinance] = useState(false);
    const [showSalarySlip, setShowSalarySlip] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const fetchFinanceSummary = async () => {
        try {
            setLoadingFinance(true);
            const res = await axios.get('http://localhost:5000/api/finance/market');
            const entries = res.data || [];

            const totalTransactions = entries.length;
            const totalRevenue = entries
                .filter(entry => entry.entryType === 'income')
                .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
            const totalExpenses = entries
                .filter(entry => entry.entryType === 'expense')
                .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

            setFinanceSummary({ totalTransactions, totalRevenue, totalExpenses });
        } catch (e) {
            console.error('Failed to fetch finance summary:', e);
            setFinanceSummary({ totalTransactions: 0, totalRevenue: 0, totalExpenses: 0 });
        } finally {
            setLoadingFinance(false);
        }
    };

    useEffect(() => {
        fetchFinanceSummary();
    }, []);

    return (
        <div className="finance-dashboard">
            <div className="finance-header">
                <h1 className="finance-title">Finance Dashboard</h1>
                <p className="finance-subtitle">Manage your financial records and transactions</p>
            </div>

            <div className="finance-chart-section">
                <PaymentHistoryChart />
            </div>

            <div className="finance-summary">
                <div className="finance-card">
                    <div className="finance-card-value">
                        {loadingFinance ? '...' : `Rs. ${financeSummary.totalRevenue.toLocaleString()}`}
                    </div>
                    <div className="finance-card-label">Total Income</div>
                </div>
                <div className="finance-card">
                    <div className="finance-card-value">
                        {loadingFinance ? '...' : `Rs. ${financeSummary.totalExpenses.toLocaleString()}`}
                    </div>
                    <div className="finance-card-label">Total Expenses</div>
                </div>
            </div>

            <div className="finance-controls">
                <div className="finance-search">
                    <span className="finance-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by description, category, or amount..."
                        value={searchTerm}
                        onChange={(e) => {
                            const filteredValue = e.target.value.replace(/[@#&~^+={}\[\]|\\\/<>$:(""|"|\*)]/g, '');
                            setSearchTerm(filteredValue);
                        }}
                    />
                </div>
                <div className="finance-filter">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>

                <button
                    className="finance-add-btn"
                    onClick={fetchFinanceSummary}
                    disabled={loadingFinance}
                    style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}
                >
                    {loadingFinance ? 'Loading...' : 'Refresh Summary'}
                </button>
            </div>

            <div className="finance-table-container">
                <Market searchTerm={searchTerm} filterType={filterType} />
            </div>

            <div className="finance-reports-section">
                <div className="finance-reports-header">
                    <h3>Financial Reports</h3>
                    <p>Generate detailed financial reports and analytics</p>
                </div>
                <div className="finance-reports-grid">
                    <div className="finance-report-card">
                        <div className="report-icon">📈</div>
                        <h4>Salary Report</h4>
                        <p>Generate comprehensive monthly Salary report</p>
                        <button className="finance-report-btn" onClick={() => setShowSalarySlip(true)}>
                            Generate Report
                        </button>
                    </div>
                    <div className="finance-report-card">
                        <div className="report-icon">💰</div>
                        <h4>Profit & Loss</h4>
                        <p>View detailed profit and loss statement</p>
                        <button className="finance-report-btn" onClick={() => setShowSalarySlip(true)}>
                            View P&L
                        </button>
                    </div>
                    <div className="finance-report-card">
                        <div className="report-icon">📊</div>
                        <h4>Cash Flow</h4>
                        <p>Analyze cash flow patterns and trends</p>
                        <button className="finance-report-btn" onClick={() => setShowSalarySlip(true)}>
                            Analyze Flow
                        </button>
                    </div>
                </div>
            </div>

            <SalarySlipModal
                open={showSalarySlip}
                onClose={() => setShowSalarySlip(false)}
            />
        </div>
    );
};

export default Finance;


