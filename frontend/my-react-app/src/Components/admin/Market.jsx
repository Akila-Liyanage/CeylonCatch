import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';//HTTP client for API calls.
import { jsPDF } from 'jspdf';
import logoUrl from '../../assets/images/logo.png';
import { scanReceipt } from '../../services/ocrService';
import './admin-users.css';

const numberOrZero = (v) => {//return 0 for invalid or nan
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const apiBase = (typeof window !== 'undefined' && (import.meta?.env?.VITE_API_BASE || `http://${window.location.hostname}:5000`)) || '';//ensure runs in browser && read Vite variable if set|fall back to empty string|not in browser , fall to empty string

// Auto-generate ID function
const generateId = (type) => {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);//time in miliseconds since 1970.1.1,,first 6 remove
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');//pad - leadingzero
    return `${type}-${timestamp}${random}`;
};

const Market = ({ searchTerm = '', filterType = 'all' }) => {
    // Income form state
    const [income, setIncome] = useState({
        id: '',
        type: 'income',
        category: '',
        description: '',
        amount: '',
        paymentMethod: '',
        receiptNumber: '',
        date: '',
        notes: ''
    });

    // Expense form state
    const [expense, setExpense] = useState({
        id: '',
        type: 'expense',
        category: '',
        description: '',
        amount: '',
        paymentMethod: '',
        receiptNumber: '',
        date: '',
        notes: ''
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({ income: {}, expense: {} });
    const [showIncomeForm, setShowIncomeForm] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [entries, setEntries] = useState([]);
    const [loadingEntries, setLoadingEntries] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [reportMonth, setReportMonth] = useState(''); // format YYYY-MM
    const [report, setReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    // Receipt scanning state
    const [receiptPhoto, setReceiptPhoto] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [receiptImageData, setReceiptImageData] = useState(null);
    const [receiptImageName, setReceiptImageName] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    // Categories for dropdowns
    const expenseCategories = [
        'Tools', 'Transport', 'Ice', 'Utilities', 'Rent', 'Miscellaneous'
    ];

    const incomeCategories = [
        'Sales', 'Commission', 'Rental Income', 'Other Income'
    ];

    const paymentMethods = [
        'Cash', 'Bank Transfer', 'Card', 'Mobile Payment', 'Cheque', 'Other'
    ];

    // Date validation function - can only add income/expense from March 1st this year to today
    const getThisYearMarch1st = () => {
        const currentYear = new Date().getFullYear();
        return new Date(currentYear, 3, 2);
    };

    const getToday = () => {
        return new Date();
    };

    const getMaxAllowedDateString = () => {
        return getToday().toISOString().split('T')[0];
    };

    const getMinAllowedDateString = () => {
        return getThisYearMarch1st().toISOString().split('T')[0];
    };

    const isDateValid = (dateString) => {
        if (!dateString) return false;
        const selectedDate = new Date(dateString);
        const maxAllowedDate = getToday();
        const minAllowedDate = getThisYearMarch1st();
        // Ensure the date is between March 1st this year and today
        return selectedDate >= minAllowedDate && selectedDate <= maxAllowedDate;
    };

    // Convert file to base64
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // Receipt scanning function
    const handleReceiptScan = async (file) => {
        if (!file) return;

        setReceiptPhoto(file);
        setIsScanning(true);
        setScanResult(null);

        try {
            // Convert image to base64 for storage
            const base64Data = await convertToBase64(file);
            setReceiptImageData(base64Data);
            setReceiptImageName(file.name);

            // Scan the image for data extraction
            const extractedData = await scanReceipt(file);
            setScanResult(extractedData);

            // Auto-fill the form with extracted data
            if (extractedData.amount) {
                setExpense(prev => ({
                    ...prev,
                    amount: extractedData.amount.toString(),
                    description: extractedData.description || prev.description,
                    category: extractedData.category || prev.category,
                    date: extractedData.date || prev.date,
                    receiptNumber: extractedData.invoiceNumber || prev.receiptNumber
                }));
            }
        } catch (error) {
            console.error('Scanning failed:', error);
            setMessage('Failed to scan receipt. Please enter data manually.');
        } finally {
            setIsScanning(false);
        }
    };

    // Simple validation
    const validateForm = (formData, type) => {
        const errors = {};

        if (!formData.category) errors.category = 'Category is required';
        if (!formData.description || formData.description.trim() === '') errors.description = 'Description is required';
        if (!formData.amount || formData.amount === '') errors.amount = 'Amount is required';
        else if (Number(formData.amount) < 0) errors.amount = 'Amount cannot be negative';
        else if (Number(formData.amount) === 0) errors.amount = 'Amount must be greater than 0';
        if (!formData.paymentMethod) errors.paymentMethod = 'Payment method is required';
        if (!formData.date) errors.date = 'Date is required';
        else if (!isDateValid(formData.date)) {
            const currentYear = new Date().getFullYear();
            const today = new Date().toLocaleDateString();
            errors.date = `Date must be between March 1st, ${currentYear} and ${today}`;
        }

        return errors;
    };

    // Set default values when component loads
    useEffect(() => {
        if (income.id === '') {
            setIncome(prev => ({ ...prev, id: generateId('INC'), date: new Date().toISOString().split('T')[0] }));
        }
        if (expense.id === '') {
            setExpense(prev => ({ ...prev, id: generateId('EXP'), date: new Date().toISOString().split('T')[0] }));
        }
    }, []);

    // Simple fetch function
    const fetchEntries = async () => {
        try {
            setLoadingEntries(true);
            const res = await axios.get(`${apiBase}/api/finance/market`);
            setEntries(res.data || []);
        } catch (e) {
            setEntries([]);
        } finally {
            setLoadingEntries(false);
        }
    };

    // Load entries on component mount
    useEffect(() => {
        fetchEntries();
    }, []);

    // Filter entries based on search term and filter type
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const matchesSearch = !searchTerm ||
                entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.amount?.toString().includes(searchTerm) ||
                entry.id?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterType === 'all' || entry.entryType === filterType;

            return matchesSearch && matchesFilter;
        });
    }, [entries, searchTerm, filterType]);

    // Simple form functions
    const openIncomeForm = () => {
        setShowIncomeForm(true);
        setShowExpenseForm(false);
        setMessage('');
        setErrors({ income: {}, expense: {} });
    };

    const openExpenseForm = () => {
        setShowExpenseForm(true);
        setShowIncomeForm(false);
        setMessage('');
        setErrors({ income: {}, expense: {} });
    };

    const closeForms = () => {
        setShowIncomeForm(false);
        setShowExpenseForm(false);
        setMessage('');
        setErrors({ income: {}, expense: {} });
        setEditingEntry(null);
        setIsEditing(false);
        setReceiptPhoto(null);
        setScanResult(null);
        setIsScanning(false);
        setReceiptImageData(null);
        setReceiptImageName(null);
    };

    // Function to display image in modal
    const showImageModal = (imageData, imageName) => {
        setSelectedImage({ data: imageData, name: imageName });
    };

    // Function to close image modal
    const closeImageModal = () => {
        setSelectedImage(null);
    };

    const openReportModal = () => {
        setShowReportModal(true);
        setMessage('');
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setReport(null);
        setReportMonth('');
    };

    // Simple edit function
    const editEntry = (entry) => {
        setEditingEntry(entry);
        setIsEditing(true);

        // Fill form with entry data
        const formData = {
            id: entry.id || generateId(entry.entryType === 'income' ? 'INC' : 'EXP'),
            type: entry.entryType,
            category: entry.category || '',
            description: entry.description || '',
            amount: String(entry.amount || ''),
            paymentMethod: entry.paymentMethod || '',
            receiptNumber: entry.receiptNumber || '',
            date: entry.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0],
            notes: entry.notes || ''
        };

        // Set the correct form
        if (entry.entryType === 'income') {
            setIncome(formData);
            setShowIncomeForm(true);
            setShowExpenseForm(false);
        } else {
            setExpense(formData);
            setShowExpenseForm(true);
            setShowIncomeForm(false);
        }

        setMessage('');
        setErrors({ income: {}, expense: {} });
    };

    // Simple delete function
    const deleteEntry = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        try {
            setSaving(true);
            await axios.delete(`${apiBase}/api/finance/market/${id}`);
            setMessage('Entry deleted successfully');
            fetchEntries();
        } catch (e) {
            setMessage(`Failed to delete entry: ${e.response?.data?.error || e.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Simple save function
    const handleSave = async (entryType, formData) => {
        // Check for errors
        const errors = validateForm(formData, entryType);
        if (Object.keys(errors).length > 0) {
            setErrors(prev => ({ ...prev, [entryType]: errors }));
            setMessage('Please fix validation errors');
            return;
        }

        try {
            setSaving(true);
            setMessage('');
            setErrors(prev => ({ ...prev, [entryType]: {} }));

            // Prepare data
            const data = {
                ...formData,
                amount: numberOrZero(formData.amount),
                entryType,
                receiptImageData: receiptImageData || null,
                receiptImageName: receiptImageName || null
            };

            // Save or update
            if (isEditing && editingEntry) {
                await axios.put(`${apiBase}/api/finance/market/${editingEntry._id}`, data);
                setMessage(`${entryType === 'income' ? 'Income' : 'Expense'} updated successfully`);
            } else {
                await axios.post(`${apiBase}/api/finance/market`, data);
                setMessage(`${entryType === 'income' ? 'Income' : 'Expense'} saved successfully`);
            }

            // Reset form
            const resetData = {
                id: generateId(entryType === 'income' ? 'INC' : 'EXP'),
                type: entryType,
                category: '',
                description: '',
                amount: '',
                paymentMethod: '',
                receiptNumber: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            };

            if (entryType === 'income') {
                setIncome(resetData);
            } else {
                setExpense(resetData);
            }

            // Refresh and close
            fetchEntries();
            setTimeout(() => closeForms(), 1500);

        } catch (e) {
            setMessage('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const monthYear = useMemo(() => {
        if (!reportMonth) return null;
        const [y, m] = reportMonth.split('-').map(Number);
        if (!y || !m) return null;
        return { year: y, month: m };
    }, [reportMonth]);

    const loadReport = async () => {
        if (!monthYear) return;
        try {
            setLoadingReport(true);
            const res = await axios.get(`${apiBase}/api/finance/market/monthly-report`, {
                params: { month: monthYear.month, year: monthYear.year }
            });
            setReport(res?.data || null);
        } catch (e) {
            setReport(null);
            alert(e?.response?.data?.error || 'Failed to load report');
        } finally {
            setLoadingReport(false);
        }
    };

    const generateProfitLossPDF = async () => {
        if (!report || !monthYear) return;

        try {
            // Fetch individual market entries for the month
            const [incomeEntries, expenseEntries] = await Promise.all([
                axios.get(`${apiBase}/api/finance/market`, {
                    params: {
                        month: monthYear.month,
                        year: monthYear.year,
                        type: 'income'
                    }
                }),
                axios.get(`${apiBase}/api/finance/market`, {
                    params: {
                        month: monthYear.month,
                        year: monthYear.year,
                        type: 'expense'
                    }
                })
            ]);

            const marketIncomeEntries = incomeEntries.data || [];
            const marketExpenseEntries = expenseEntries.data || [];

            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 40;
            let y = margin;
            const lineGap = 20;

            const textRight = (t, x, yy, size = 12) => {
                doc.setFontSize(size);
                doc.text(String(t ?? ''), x, yy, { align: 'right' });
            };
            const text = (t, x, yy, size = 12) => {
                doc.setFontSize(size);
                doc.text(String(t ?? ''), x, yy);
            };
            const hr = (yy) => {
                doc.setLineWidth(0.8);
                doc.line(margin, yy, pageWidth - margin, yy);
            };
            const fmtNum = (n) => `LKR ${Number(n || 0).toFixed(2)}`;

            const toDataURL = (url) => new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width; canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = url;
            });

            const logoData = await toDataURL(logoUrl);

            // Header with logo
            const logoW = 100, logoH = 100;
            doc.addImage(logoData, 'PNG', margin, y - 30, logoW, logoH);
            doc.setFontSize(24);
            doc.text('CeylonCatch Ltd', pageWidth / 2, y + 10, { align: 'center' });
            doc.setFontSize(10);
            doc.text('[Chilaw Fish Market, Chilaw, Sri Lanka]', pageWidth / 2, y + 25, { align: 'center' });
            y += 50;

            // Title
            doc.setFontSize(20);
            doc.text('Profit & Loss Statement', pageWidth / 2, y, { align: 'center' });
            y += 25;

            // Period
            const periodStr = `${String(report?.period?.month).padStart(2, '0')}/${report?.period?.year}`;
            doc.setFontSize(14);
            doc.text(`For the month of ${periodStr}`, pageWidth / 2, y, { align: 'center' });
            y += 30;
            hr(y); y += 15;

            // Income Section
            doc.setFontSize(16);
            doc.text('INCOME', margin, y);
            y += 25;

            const tableLeft = margin;
            const tableRight = pageWidth - margin;
            const rowH = 20;

            // Individual Market Income Entries
            doc.setFontSize(12);
            if (marketIncomeEntries.length > 0) {
                text('Market Income:', tableLeft, y);
                y += rowH;
                marketIncomeEntries.forEach(entry => {
                    const description = entry.category;
                    text(`  ${description}`, tableLeft + 20, y);
                    textRight(fmtNum(entry.amount), tableRight, y);
                    y += rowH;
                });
            } else {
                text('Market Income: LKR 0.00', tableLeft, y);
                y += rowH;
            }

            // Shop Sales Income
            text('Shop Sales Income:', tableLeft, y);
            textRight(fmtNum(report.totals.shopSalesIncome), tableRight, y);
            y += rowH;

            // Total Income
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            const totalIncome = report.totals.marketIncome + report.totals.shopSalesIncome;
            text('Total Income:', tableLeft, y);
            textRight(fmtNum(totalIncome), tableRight, y);
            y += rowH + 10;

            // Expenses Section
            doc.setFontSize(16);
            doc.text('EXPENSES', margin, y);
            y += 25;

            // Individual Market Expense Entries
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            if (marketExpenseEntries.length > 0) {
                text('Market Expenses:', tableLeft, y);
                y += rowH;
                marketExpenseEntries.forEach(entry => {
                    const description = entry.category;
                    text(`  ${description}`, tableLeft + 20, y);
                    textRight(fmtNum(entry.amount), tableRight, y);
                    y += rowH;
                });
            } else {
                text('Market Expenses: LKR 0.00', tableLeft, y);
                y += rowH;
            }

            // Salary Payouts
            text('Salary Payouts:', tableLeft, y);
            textRight(fmtNum(report.totals.salaryPayouts), tableRight, y);
            y += rowH;

            // Total Expenses
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            const totalExpenses = report.totals.marketExpense + report.totals.salaryPayouts;
            text('Total Expenses:', tableLeft, y);
            textRight(fmtNum(totalExpenses), tableRight, y);
            y += rowH + 15;

            // Net Profit/Loss
            hr(y); y += 15;
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            const netAmount = totalIncome - totalExpenses;
            const isProfit = netAmount >= 0;
            text(`${isProfit ? 'NET PROFIT' : 'NET LOSS'}:`, tableLeft, y);
            textRight(fmtNum(Math.abs(netAmount)), tableRight, y);
            y += rowH + 20;

            // Summary
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            text(`This statement shows the financial performance for ${periodStr}`, margin, y);
            y += 15;
            text(`Total Market Income: ${fmtNum(report.totals.marketIncome)}`, margin, y);
            y += 15;
            text(`Total Shop Sales: ${fmtNum(report.totals.shopSalesIncome)}`, margin, y);
            y += 15;
            text(`Total Income: ${fmtNum(totalIncome)}`, margin, y);
            y += 15;
            text(`Total Market Expenses: ${fmtNum(report.totals.marketExpense)}`, margin, y);
            y += 15;
            text(`Total Salary Expenses: ${fmtNum(report.totals.salaryPayouts)}`, margin, y);
            y += 15;
            text(`Total Expenses: ${fmtNum(totalExpenses)}`, margin, y);
            y += 15;
            text(`Result: ${isProfit ? 'Profit' : 'Loss'} of ${fmtNum(Math.abs(netAmount))}`, margin, y);

            // Footer
            y = doc.internal.pageSize.getHeight() - 60;
            hr(y); y += 15;
            doc.setFontSize(10);
            doc.text('Generated on: ' + new Date().toLocaleDateString(), margin, y);
            doc.text('CeylonCatch Ltd - Financial Report', pageWidth / 2, y, { align: 'center' });

            const fileName = `ProfitLoss_${periodStr.replace('/', '_')}.pdf`;
            doc.save(fileName);
        } catch (error) {
            alert('Failed to generate PDF: ' + (error?.response?.data?.error || error.message));
        }
    };

    return (
        <div className="finance-dashboard-content">
            {message && (
                <div className={`finance-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {/* Action Buttons */}
            <div className="finance-action-buttons">
                <button
                    className="finance-add-btn"
                    onClick={openIncomeForm}
                >
                    + Add Income
                </button>
                <button
                    className="finance-add-btn"
                    onClick={openExpenseForm}
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                    + Add Expense
                </button>
            </div>

            {/* Income Form */}
            {showIncomeForm && (
                <div className={`finance-form-container ${isEditing ? 'editing-form' : ''}`}>
                    <div className="finance-form-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 className="finance-form-title">{isEditing ? 'Edit Income' : 'Add Income'}</h3>
                            {isEditing && <span className="edit-indicator">✏️ Editing</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="id-display">ID: {income.id}</div>
                            <button className="finance-form-close" onClick={closeForms}>✕</button>
                        </div>
                    </div>
                    <div className="form-body">
                        <div className="finance-form-grid">
                            <div className="finance-form-field">
                                <label className="finance-form-label">Type/Category *</label>
                                <select
                                    value={income.category}
                                    onChange={e => setIncome(prev => ({ ...prev, category: e.target.value }))}
                                    className={`finance-form-select ${errors.income.category ? 'error' : ''}`}
                                >
                                    <option value="">Select Category</option>
                                    {incomeCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.income.category && <div className="error-text">{errors.income.category}</div>}
                            </div>
                            <div className="finance-form-field">
                                <label className="finance-form-label">Amount (LKR) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={income.amount}
                                    onChange={e => setIncome(prev => ({ ...prev, amount: e.target.value }))}
                                    onInput={e => {
                                        if (e.target.value <= 0) e.target.value = 1;
                                    }}
                                    placeholder="Eg:1000.00"
                                    className={`finance-form-input ${errors.income.amount ? 'error' : ''}`}
                                />
                                {errors.income.amount && <div className="error-text">{errors.income.amount}</div>}
                            </div>
                        </div>

                        <div className="finance-form-field">
                            <label className="finance-form-label">Description *</label>
                            <input
                                type="text"
                                value={income.description}
                                onChange={e => setIncome(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="e.g., Daily fish sales from market stall"
                                className={`finance-form-input ${errors.income.description ? 'error' : ''}`}
                            />
                            {errors.income.description && <div className="error-text">{errors.income.description}</div>}
                        </div>

                        <div className="finance-form-grid">
                            <div className="finance-form-field">
                                <label className="finance-form-label">Payment Method *</label>
                                <select
                                    value={income.paymentMethod}
                                    onChange={e => setIncome(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                    className={`finance-form-select ${errors.income.paymentMethod ? 'error' : ''}`}
                                >
                                    <option value="">Select Method</option>
                                    {paymentMethods.map(method => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                                {errors.income.paymentMethod && <div className="error-text">{errors.income.paymentMethod}</div>}
                            </div>
                            <div className="finance-form-field">
                                <label className="finance-form-label">Receipt/Invoice Number</label>
                                <input
                                    type="text"
                                    value={income.receiptNumber}
                                    onChange={e => setIncome(prev => ({ ...prev, receiptNumber: e.target.value }))}
                                    placeholder="Optional"
                                    className="finance-form-input"
                                />
                            </div>
                        </div>

                        <div className="finance-form-field">
                            <label className="finance-form-label">Date *</label>
                            <input
                                type="date"
                                value={income.date}
                                onChange={e => setIncome(prev => ({ ...prev, date: e.target.value }))}
                                min={getMinAllowedDateString()}
                                max={getMaxAllowedDateString()}
                                className={`finance-form-input ${errors.income.date ? 'error' : ''}`}
                            />
                            {errors.income.date && <div className="error-text">{errors.income.date}</div>}
                        </div>

                        <div className="finance-form-field">
                            <label className="finance-form-label">Reference/Notes</label>
                            <textarea
                                value={income.notes}
                                onChange={e => setIncome(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional details, customer info, etc. (optional)"
                                rows="3"
                                className="finance-form-textarea"
                            />
                        </div>

                        <div className="finance-form-buttons">
                            <button className="finance-form-btn finance-form-btn-secondary" onClick={closeForms}>Cancel</button>
                            <button
                                className="finance-form-btn finance-form-btn-primary"
                                disabled={saving}
                                onClick={() => handleSave('income', income)}
                            >
                                {saving ? 'Saving...' : 'Save Income'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Form */}
            {showExpenseForm && (
                <div className={`finance-form-container ${isEditing ? 'editing-form' : ''}`}>
                    <div className="finance-form-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 className="finance-form-title">{isEditing ? 'Edit Expense' : 'Add Expense'}</h3>
                            {isEditing && <span className="edit-indicator">✏️ Editing</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="id-display">ID: {expense.id}</div>
                            <button className="finance-form-close" onClick={closeForms}>✕</button>
                        </div>
                    </div>
                    <div className="form-body">
                        {/* Receipt Photo Section */}
                        <div className="receipt-section">
                            <label className="finance-form-label">Receipt Photo (Optional)</label>
                            <div className="receipt-upload-area">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleReceiptScan(e.target.files[0])}
                                    className="receipt-input"
                                />
                                {receiptPhoto && (
                                    <div className="receipt-preview">
                                        <img
                                            src={URL.createObjectURL(receiptPhoto)}
                                            alt="Receipt"
                                            style={{ width: '200px', height: 'auto', marginTop: '10px' }}
                                        />
                                        {isScanning && <p>Scanning receipt...</p>}
                                        {scanResult && (
                                            <div className="scan-result">
                                                <p>Scanned data found:</p>
                                                <ul>
                                                    {scanResult.amount && <li>Amount: {scanResult.amount}</li>}
                                                    {scanResult.date && <li>Date: {scanResult.date}</li>}
                                                    {scanResult.invoiceNumber && <li>Invoice Number: {scanResult.invoiceNumber}</li>}
                                                    {scanResult.category && <li>Category: {scanResult.category}</li>}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="finance-form-grid">
                            <div className="finance-form-field">
                                <label className="finance-form-label">Type/Category *</label>
                                <select
                                    value={expense.category}
                                    onChange={e => setExpense(prev => ({ ...prev, category: e.target.value }))}
                                    className={`finance-form-select ${errors.expense.category ? 'error' : ''}`}
                                >
                                    <option value="">Select Category</option>
                                    {expenseCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.expense.category && <div className="error-text">{errors.expense.category}</div>}
                            </div>
                            <div className="finance-form-field">
                                <label className="finance-form-label">Amount (LKR) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={expense.amount}
                                    onChange={e => setExpense(prev => ({ ...prev, amount: e.target.value }))}
                                    onInput={e => {
                                        if (e.target.value <= 0) e.target.value = 1;
                                    }}
                                    placeholder="Eg:1000.00"
                                    className={`finance-form-input ${errors.expense.amount ? 'error' : ''}`}
                                />
                                {errors.expense.amount && <div className="error-text">{errors.expense.amount}</div>}
                            </div>
                        </div>

                        <div className="finance-form-field">
                            <label className="finance-form-label">Description *</label>
                            <input
                                type="text"
                                value={expense.description}
                                onChange={e => setExpense(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="e.g., Purchased weighing scale for market stall"
                                className={`finance-form-input ${errors.expense.description ? 'error' : ''}`}
                            />
                            {errors.expense.description && <div className="error-text">{errors.expense.description}</div>}
                        </div>

                        <div className="finance-form-grid">
                            <div className="finance-form-field">
                                <label className="finance-form-label">Payment Method *</label>
                                <select
                                    value={expense.paymentMethod}
                                    onChange={e => setExpense(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                    className={`finance-form-select ${errors.expense.paymentMethod ? 'error' : ''}`}
                                >
                                    <option value="">Select Method</option>
                                    {paymentMethods.map(method => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                                {errors.expense.paymentMethod && <div className="error-text">{errors.expense.paymentMethod}</div>}
                            </div>
                            <div className="finance-form-field">
                                <label className="finance-form-label">Receipt/Invoice Number</label>
                                <input
                                    type="text"
                                    value={expense.receiptNumber}
                                    onChange={e => setExpense(prev => ({ ...prev, receiptNumber: e.target.value }))}
                                    placeholder="Optional"
                                    className="finance-form-input"
                                />
                            </div>
                        </div>

                        <div className="finance-form-field">
                            <label className="finance-form-label">Date *</label>
                            <input
                                type="date"
                                value={expense.date}
                                onChange={e => setExpense(prev => ({ ...prev, date: e.target.value }))}
                                min={getMinAllowedDateString()}
                                max={getMaxAllowedDateString()}
                                className={`finance-form-input ${errors.expense.date ? 'error' : ''}`}
                            />
                            {errors.expense.date && <div className="error-text">{errors.expense.date}</div>}
                        </div>

                        <div className="finance-form-field">
                            <label className="finance-form-label">Reference/Notes</label>
                            <textarea
                                value={expense.notes}
                                onChange={e => setExpense(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Warranty info, reason for purchase, supplier details, etc. (optional)"
                                rows="3"
                                className="finance-form-textarea"
                            />
                        </div>

                        <div className="finance-form-buttons">
                            <button className="finance-form-btn finance-form-btn-secondary" onClick={closeForms}>Cancel</button>
                            <button
                                className="finance-form-btn finance-form-btn-primary"
                                disabled={saving}
                                onClick={() => handleSave('expense', expense)}
                            >
                                {saving ? 'Saving...' : 'Save Expense'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Entries Table */}
            <div className="finance-entries-section">
                <div className="finance-entries-header">
                    <div>
                        <h3>Financial Entries</h3>
                        <p className="entries-count">
                            {loadingEntries ? 'Loading...' : `${filteredEntries.length} of ${entries.length} entries`}
                            {searchTerm && ` matching "${searchTerm}"`}
                            {filterType !== 'all' && ` (${filterType} only)`}
                        </p>
                    </div>
                    <button
                        className="finance-add-btn"
                        onClick={fetchEntries}
                        disabled={loadingEntries}
                        style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}
                    >
                        {loadingEntries ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {loadingEntries ? (
                    <div className="finance-loading">Loading entries...</div>
                ) : filteredEntries.length === 0 ? (
                    <div className="finance-empty">
                        {searchTerm || filterType !== 'all'
                            ? 'No entries found matching your search criteria.'
                            : 'No entries found. Add some income or expense entries to get started.'
                        }
                    </div>
                ) : (
                    <div className="finance-table-container">
                        <table className="finance-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>ID</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount (LKR)</th>
                                    <th>Payment Method</th>
                                    <th>Receipt #</th>
                                    <th>Receipt Image</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry) => {
                                    const isIncome = entry.entryType === 'income';
                                    const amount = Number(entry.amount || 0).toFixed(2);
                                    const displayDate = entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A';

                                    return (
                                        <tr key={entry._id}>
                                            <td>
                                                <span className={`finance-type-badge ${isIncome ? 'finance-type-income' : 'finance-type-expense'}`}>
                                                    {isIncome ? 'Income' : 'Expense'}
                                                </span>
                                            </td>
                                            <td className="finance-sku">{entry.id || 'N/A'}</td>
                                            <td>{entry.category || 'N/A'}</td>
                                            <td className="finance-description">
                                                {entry.description || 'N/A'}
                                                {entry.notes && (
                                                    <div className="finance-notes" title={entry.notes}>
                                                        📝 {entry.notes.length > 50 ? entry.notes.substring(0, 50) + '...' : entry.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="finance-price">
                                                {isIncome ? '+' : '-'}LKR {amount}
                                            </td>
                                            <td>{entry.paymentMethod || 'N/A'}</td>
                                            <td>{entry.receiptNumber || 'N/A'}</td>
                                            <td>
                                                {entry.receiptImageData ? (
                                                    <button
                                                        className="receipt-image-btn"
                                                        onClick={() => showImageModal(entry.receiptImageData, entry.receiptImageName)}
                                                        title="View Receipt Image"
                                                    >
                                                        📷 View
                                                    </button>
                                                ) : (
                                                    <span className="no-image">No Image</span>
                                                )}
                                            </td>
                                            <td>{displayDate}</td>
                                            <td className="finance-actions">
                                                <button className="finance-action-btn finance-action-edit" onClick={() => editEntry(entry)} title="Edit">✏️</button>
                                                <button className="finance-action-btn finance-action-delete" onClick={() => deleteEntry(entry._id)} title="Delete">🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Monthly Report Button */}
            <div className="finance-entries-section">
                <div className="finance-entries-header">
                    <div>
                        <h3>Financial Reports</h3>
                        <p className="entries-count">Generate detailed financial reports and analytics</p>
                    </div>
                    <button
                        className="finance-add-btn"
                        onClick={openReportModal}
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                        📊 Profit & Loss Report
                    </button>
                </div>
            </div>

            {/* Monthly Report Modal */}
            {showReportModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Monthly Profit & Loss Report</h2>
                            <button className="modal-close" onClick={closeReportModal}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="report-form-section">
                                <div className="form-group">
                                    <label className="form-label">Select Month & Year</label>
                                    <input
                                        type="month"
                                        value={reportMonth}
                                        onChange={e => setReportMonth(e.target.value)}
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={closeReportModal}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        disabled={!reportMonth || loadingReport}
                                        onClick={loadReport}
                                    >
                                        {loadingReport ? 'Generating...' : 'Generate Report'}
                                    </button>
                                </div>
                            </div>

                            {report && (
                                <div className="report-results-section">
                                    <div className="report-summary">
                                        <h3>Report Summary for {reportMonth}</h3>
                                        <div className="summary-grid">
                                            <div className="summary-card">
                                                <div className="summary-label">Market Income</div>
                                                <div className="summary-value income">Rs. {report.totals.marketIncome?.toLocaleString() || '0'}</div>
                                            </div>
                                            <div className="summary-card">
                                                <div className="summary-label">Shop Sales</div>
                                                <div className="summary-value income">Rs. {report.totals.shopSalesIncome?.toLocaleString() || '0'}</div>
                                            </div>
                                            <div className="summary-card">
                                                <div className="summary-label">Total Income</div>
                                                <div className="summary-value income total">Rs. {(report.totals.marketIncome + report.totals.shopSalesIncome)?.toLocaleString() || '0'}</div>
                                            </div>
                                            <div className="summary-card">
                                                <div className="summary-label">Market Expenses</div>
                                                <div className="summary-value expense">Rs. {report.totals.marketExpense?.toLocaleString() || '0'}</div>
                                            </div>
                                            <div className="summary-card">
                                                <div className="summary-label">Salary Payouts</div>
                                                <div className="summary-value expense">Rs. {report.totals.salaryPayouts?.toLocaleString() || '0'}</div>
                                            </div>
                                            <div className="summary-card">
                                                <div className="summary-label">Total Expenses</div>
                                                <div className="summary-value expense total">Rs. {(report.totals.marketExpense + report.totals.salaryPayouts)?.toLocaleString() || '0'}</div>
                                            </div>
                                        </div>

                                        <div className="net-result">
                                            <div className="net-label">Net {((report.totals.marketIncome + report.totals.shopSalesIncome) - (report.totals.marketExpense + report.totals.salaryPayouts)) >= 0 ? 'Profit' : 'Loss'}</div>
                                            <div className={`net-value ${((report.totals.marketIncome + report.totals.shopSalesIncome) - (report.totals.marketExpense + report.totals.salaryPayouts)) >= 0 ? 'profit' : 'loss'}`}>
                                                Rs. {Math.abs((report.totals.marketIncome + report.totals.shopSalesIncome) - (report.totals.marketExpense + report.totals.salaryPayouts))?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="report-actions">
                                        <button
                                            className="btn btn-success"
                                            onClick={generateProfitLossPDF}
                                        >
                                            📄 Generate PDF Report
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={closeReportModal}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div className="image-modal-overlay" onClick={closeImageModal}>
                    <div className="image-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="image-modal-header">
                            <h3>Receipt Image</h3>
                            <button className="image-modal-close" onClick={closeImageModal}>✕</button>
                        </div>
                        <div className="image-modal-body">
                            <img
                                src={selectedImage.data}
                                alt={selectedImage.name || 'Receipt'}
                                className="receipt-image-display"
                            />
                            {selectedImage.name && (
                                <p className="image-filename">{selectedImage.name}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Market;


