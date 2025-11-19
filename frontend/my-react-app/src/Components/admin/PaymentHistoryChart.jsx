import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const PaymentHistoryChart = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [chartType, setChartType] = useState('bar');
    const [timeRange, setTimeRange] = useState('month');

    // Fetch transactions from API
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get('http://localhost:5000/api/finance/transactions/all');
            console.log('Fetched transactions:', response.data);
            setTransactions(response.data || []);
        } catch (err) {
            setError('Failed to fetch transaction data');
            console.error('Error fetching transactions:', err);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Process data for charts
    const processChartData = () => {
        if (!transactions.length) return { labels: [], datasets: [] };

        const now = new Date();
        let filteredTransactions = [];

        // Filter by time range
        switch (timeRange) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredTransactions = transactions.filter(tx => new Date(tx.createdAt || tx.created_at) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredTransactions = transactions.filter(tx => new Date(tx.createdAt || tx.created_at) >= monthAgo);
                break;
            case 'quarter':
                const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                filteredTransactions = transactions.filter(tx => new Date(tx.createdAt || tx.created_at) >= quarterAgo);
                break;
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                filteredTransactions = transactions.filter(tx => new Date(tx.createdAt || tx.created_at) >= yearAgo);
                break;
            default:
                filteredTransactions = transactions;
        }

        // Group by date
        const groupedData = {};
        filteredTransactions.forEach(tx => {
            const date = new Date(tx.createdAt || tx.created_at).toLocaleDateString();
            if (!groupedData[date]) {
                groupedData[date] = { total: 0, count: 0, types: {} };
            }
            groupedData[date].total += tx.amount || 0;
            groupedData[date].count += 1;
            groupedData[date].types[tx.type] = (groupedData[date].types[tx.type] || 0) + (tx.amount || 0);
        });

        const labels = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));
        const amounts = labels.map(date => groupedData[date].total);
        const counts = labels.map(date => groupedData[date].count);

        // Get unique transaction types
        const types = [...new Set(filteredTransactions.map(tx => tx.type))];
        const typeColors = {
            purchase: '#667eea',
            auction: '#f093fb',
            salary: '#4facfe',
            default: '#43e97b'
        };

        return {
            labels,
            datasets: [
                {
                    label: 'Total Amount (LKR)',
                    data: amounts,
                    backgroundColor: 'rgba(102, 126, 234, 0.3)',
                    borderColor: 'rgba(102, 126, 234, 0.8)',
                    borderWidth: 2,
                    yAxisID: 'y',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Transaction Count',
                    data: counts,
                    backgroundColor: 'rgba(240, 147, 251, 0.3)',
                    borderColor: 'rgba(240, 147, 251, 0.8)',
                    borderWidth: 2,
                    yAxisID: 'y1',
                    fill: true,
                    tension: 0.4
                }
            ],
            typeData: types.map((type, index) => {
                const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#ffecd2', '#a8edea', '#d299c2'];
                return {
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    data: filteredTransactions
                        .filter(tx => tx.type === type)
                        .reduce((sum, tx) => sum + (tx.amount || 0), 0),
                    backgroundColor: colors[index % colors.length],
                    borderColor: '#ffffff',
                    borderWidth: 2
                };
            })
        };
    };

    const chartData = processChartData();

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#e2e8f0',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    usePointStyle: true,
                    padding: 20
                }
            },
            title: {
                display: true,
                text: `Payment History - ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} View`,
                color: '#f1f5f9',
                font: {
                    size: 16,
                    weight: '600'
                },
                padding: {
                    top: 10,
                    bottom: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f1f5f9',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(148, 163, 184, 0.3)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                padding: 12
            }
        },
        scales: {
            x: {
                grid: {
                    display: true,
                    color: 'rgba(148, 163, 184, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#94a3b8',
                    font: {
                        size: 11,
                        weight: '500'
                    }
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Amount (LKR)',
                    color: '#e2e8f0',
                    font: {
                        size: 12,
                        weight: '600'
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(148, 163, 184, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#94a3b8',
                    font: {
                        size: 11,
                        weight: '500'
                    },
                    callback: function (value) {
                        return 'LKR ' + value.toLocaleString();
                    }
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Transaction Count',
                    color: '#e2e8f0',
                    font: {
                        size: 12,
                        weight: '600'
                    }
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: '#94a3b8',
                    font: {
                        size: 11,
                        weight: '500'
                    }
                }
            },
        },
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#e2e8f0',
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    usePointStyle: true,
                    padding: 20
                }
            },
            title: {
                display: true,
                text: 'Transaction Types Distribution',
                color: '#f1f5f9',
                font: {
                    size: 16,
                    weight: '600'
                },
                padding: {
                    top: 10,
                    bottom: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f1f5f9',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(148, 163, 184, 0.3)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                padding: 12,
                callbacks: {
                    label: function (context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: LKR ${context.parsed.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        },
    };

    const renderChart = () => {
        if (chartType === 'pie') {
            return (
                <Pie
                    data={{
                        labels: chartData.typeData.map(item => item.label),
                        datasets: [{
                            data: chartData.typeData.map(item => item.data),
                            backgroundColor: chartData.typeData.map(item => item.backgroundColor),
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    }}
                    options={pieOptions}
                />
            );
        }

        const ChartComponent = chartType === 'line' ? Line : Bar;
        return <ChartComponent data={chartData} options={options} />;
    };

    if (loading) {
        return (
            <div className="payment-chart-container">
                <div className="payment-chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading payment history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="payment-chart-container">
                <div className="payment-chart-error">
                    <p>❌ {error}</p>
                    <button
                        className="retry-btn"
                        onClick={fetchTransactions}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!transactions.length) {
        return (
            <div className="payment-chart-container">
                <div className="payment-chart-empty">
                    <p>📊 No transaction data available</p>
                    <button
                        className="retry-btn"
                        onClick={fetchTransactions}
                    >
                        Refresh Data
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-chart-container">
            <div className="payment-chart-header">
                <h3>Sales  Analytics</h3>
                <div className="chart-controls">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="chart-select"
                    >
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="quarter">Last Quarter</option>
                        <option value="year">Last Year</option>
                        <option value="all">All Time</option>
                    </select>

                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        className="chart-select"
                    >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="pie">Pie Chart</option>
                    </select>

                    <button
                        onClick={fetchTransactions}
                        className="refresh-btn"
                        disabled={loading}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            <div className="chart-stats">
                <div className="stat-card">
                    <div className="stat-value">{transactions.length}</div>
                    <div className="stat-label">Total Transactions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        LKR {transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0).toLocaleString()}
                    </div>
                    <div className="stat-label">Total Amount</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        LKR {transactions.length > 0 ? Math.round(transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0) / transactions.length).toLocaleString() : 0}
                    </div>
                    <div className="stat-label">Average Amount</div>
                </div>
            </div>

            <div className="chart-wrapper">
                {renderChart()}
            </div>

            <style jsx>{`
         .payment-chart-container {
           background: rgba(30, 41, 59, 0.8);
           backdrop-filter: blur(10px);
           border: 1px solid rgba(148, 163, 184, 0.1);
           border-radius: 16px;
           padding: 2rem;
           box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
           margin-bottom: 2rem;
           position: relative;
           z-index: 1;
           transition: all 0.3s ease;
         }

         .payment-chart-container:hover {
           transform: translateY(-2px);
           box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
           border-color: rgba(148, 163, 184, 0.2);
         }

         .payment-chart-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-bottom: 2rem;
           flex-wrap: wrap;
           gap: 1rem;
         }

         .payment-chart-header h3 {
           margin: 0;
           font-size: 1.5rem;
           font-weight: 700;
           color: #f1f5f9;
           text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
         }

         .chart-controls {
           display: flex;
           gap: 1rem;
           align-items: center;
           flex-wrap: wrap;
         }

         .chart-select {
           padding: 0.75rem 1rem;
           border: 1px solid rgba(148, 163, 184, 0.2);
           border-radius: 8px;
           background: rgba(30, 41, 59, 0.6);
           backdrop-filter: blur(10px);
           font-size: 0.875rem;
           color: #e2e8f0;
           font-weight: 500;
           transition: all 0.3s ease;
           min-width: 140px;
         }

         .chart-select:focus {
           outline: none;
           border-color: rgba(120, 119, 198, 0.5);
           box-shadow: 0 0 0 3px rgba(120, 119, 198, 0.1);
           background: rgba(30, 41, 59, 0.8);
         }

         .chart-select:hover {
           border-color: rgba(148, 163, 184, 0.4);
           background: rgba(30, 41, 59, 0.7);
         }

         .chart-select option {
           background: #1e293b;
           color: #e2e8f0;
         }

         .refresh-btn {
           padding: 0.75rem 1.5rem;
           background: linear-gradient(135deg, rgba(120, 119, 198, 0.8) 0%, rgba(255, 119, 198, 0.8) 100%);
           color: #f1f5f9;
           border: 1px solid rgba(120, 119, 198, 0.3);
           border-radius: 8px;
           font-size: 0.875rem;
           font-weight: 600;
           cursor: pointer;
           transition: all 0.3s ease;
           backdrop-filter: blur(10px);
         }

         .refresh-btn:hover:not(:disabled) {
           transform: translateY(-2px);
           box-shadow: 0 8px 25px rgba(120, 119, 198, 0.3);
           background: linear-gradient(135deg, rgba(120, 119, 198, 0.9) 0%, rgba(255, 119, 198, 0.9) 100%);
         }

         .refresh-btn:disabled {
           opacity: 0.6;
           cursor: not-allowed;
           transform: none;
         }

         .chart-stats {
           display: grid;
           grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
           gap: 1.5rem;
           margin-bottom: 2rem;
         }

         .stat-card {
           background: rgba(30, 41, 59, 0.6);
           backdrop-filter: blur(10px);
           border: 1px solid rgba(148, 163, 184, 0.1);
           border-radius: 12px;
           padding: 1.5rem;
           text-align: center;
           transition: all 0.3s ease;
           position: relative;
           overflow: hidden;
         }

         .stat-card::before {
           content: '';
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           height: 2px;
           background: linear-gradient(90deg, rgba(120, 119, 198, 0.8), rgba(255, 119, 198, 0.8), rgba(120, 219, 255, 0.8));
           background-size: 200% 100%;
           animation: gradientShift 3s ease infinite;
         }

         @keyframes gradientShift {
           0%, 100% { background-position: 0% 50%; }
           50% { background-position: 100% 50%; }
         }

         .stat-card:hover {
           transform: translateY(-2px);
           box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
           border-color: rgba(148, 163, 184, 0.2);
         }

         .stat-value {
           font-size: 2rem;
           font-weight: 700;
           color: #f1f5f9;
           margin: 0 0 0.5rem 0;
           line-height: 1;
           text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
         }

         .stat-label {
           font-size: 0.875rem;
           color: #94a3b8;
           font-weight: 500;
           text-transform: uppercase;
           letter-spacing: 0.05em;
         }

         .chart-wrapper {
           height: 400px;
           position: relative;
           background: rgba(15, 23, 42, 0.3);
           border-radius: 12px;
           padding: 1rem;
           backdrop-filter: blur(5px);
           border: 1px solid rgba(148, 163, 184, 0.1);
         }

         .payment-chart-loading {
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
           height: 300px;
           color: #94a3b8;
           background: rgba(15, 23, 42, 0.3);
           border-radius: 12px;
           backdrop-filter: blur(5px);
         }

         .loading-spinner {
           width: 50px;
           height: 50px;
           border: 4px solid rgba(148, 163, 184, 0.2);
           border-top: 4px solid rgba(120, 119, 198, 0.8);
           border-radius: 50%;
           animation: spin 1s linear infinite;
           margin-bottom: 1rem;
         }

         @keyframes spin {
           0% { transform: rotate(0deg); }
           100% { transform: rotate(360deg); }
         }

         .payment-chart-error {
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
           height: 300px;
           color: #fca5a5;
           background: rgba(15, 23, 42, 0.3);
           border-radius: 12px;
           backdrop-filter: blur(5px);
           border: 1px solid rgba(248, 113, 113, 0.2);
         }

         .payment-chart-empty {
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
           height: 300px;
           color: #94a3b8;
           background: rgba(15, 23, 42, 0.3);
           border-radius: 12px;
           backdrop-filter: blur(5px);
           border: 1px solid rgba(148, 163, 184, 0.1);
         }

         .retry-btn {
           margin-top: 1rem;
           padding: 0.75rem 1.5rem;
           background: linear-gradient(135deg, rgba(120, 119, 198, 0.8) 0%, rgba(255, 119, 198, 0.8) 100%);
           color: #f1f5f9;
           border: 1px solid rgba(120, 119, 198, 0.3);
           border-radius: 8px;
           cursor: pointer;
           font-weight: 600;
           transition: all 0.3s ease;
           backdrop-filter: blur(10px);
         }

         .retry-btn:hover {
           transform: translateY(-2px);
           box-shadow: 0 8px 25px rgba(120, 119, 198, 0.3);
           background: linear-gradient(135deg, rgba(120, 119, 198, 0.9) 0%, rgba(255, 119, 198, 0.9) 100%);
         }

         @media (max-width: 768px) {
           .payment-chart-header {
             flex-direction: column;
             align-items: stretch;
           }

           .chart-controls {
             justify-content: center;
           }

           .chart-stats {
             grid-template-columns: 1fr;
           }
         }
       `}</style>
        </div>
    );
};

export default PaymentHistoryChart;
