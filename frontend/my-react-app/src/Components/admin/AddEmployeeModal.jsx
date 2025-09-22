import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './admin-users.css';

const generateEmployeeId = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `EMP-${y}${m}${d}-${rand}`;
};

const monthDiff = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start.getFullYear(), start.getMonth(), 1);
    const e = new Date(end.getFullYear(), end.getMonth(), 1);
    const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
    return Math.max(months, 0);
};

const computeAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
};

const SL_MONTHLY_BRACKETS = [
    { upto: 100000, rate: 0.06 },
    { upto: 141667, rate: 0.12 },
    { upto: 183333, rate: 0.18 },
    { upto: 225000, rate: 0.24 },
    { upto: 266667, rate: 0.30 },
    { upto: Infinity, rate: 0.36 },
];

const computeMonthlyPAYE = (taxable) => {
    const income = Math.max(Number(taxable || 0), 0);
    let remaining = income;
    let prevCap = 0;
    let tax = 0;
    for (const b of SL_MONTHLY_BRACKETS) {
        const cap = b.upto;
        const slabAmount = Math.max(Math.min(remaining, cap - prevCap), 0);
        if (slabAmount <= 0) break;
        tax += slabAmount * b.rate;
        remaining -= slabAmount;
        prevCap = cap;
        if (remaining <= 0) break;
    }
    return Math.max(tax, 0);
};

const AddEmployeeModal = ({ open, onClose, onSave }) => {
    const [employeeId, setEmployeeId] = useState('');
    const [fullName, setFullName] = useState('');
    const [dobStr, setDobStr] = useState('');
    const [nic, setNic] = useState('');
    const [basicSalary, setBasicSalary] = useState('');
    const [allowances, setAllowances] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankBranch, setBankBranch] = useState('');
    const [loanAmount, setLoanAmount] = useState('');
    const [monthlyDeduction, setMonthlyDeduction] = useState('');
    const [loanStart, setLoanStart] = useState('');
    const [loanEnd, setLoanEnd] = useState('');
    const [status, setStatus] = useState('Active');
    const [epfEligible, setEpfEligible] = useState('Yes');
    const [etfEligible, setEtfEligible] = useState('Yes');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (open) setEmployeeId(generateEmployeeId());
    }, [open]);

    const dobDate = useMemo(() => (dobStr ? new Date(dobStr) : null), [dobStr]);
    const age = useMemo(() => computeAge(dobDate), [dobDate]);

    const startDate = useMemo(() => (loanStart ? new Date(loanStart + '-01') : null), [loanStart]);
    const endDate = useMemo(() => (loanEnd ? new Date(loanEnd + '-01') : null), [loanEnd]);

    const plannedMonths = useMemo(() => {
        if (startDate && endDate) return monthDiff(startDate, endDate);
        const amt = Number(loanAmount || 0);
        const inst = Number(monthlyDeduction || 0);
        if (amt > 0 && inst > 0) return Math.ceil(amt / inst);
        return 0;
    }, [startDate, endDate, loanAmount, monthlyDeduction]);

    const remainingBalance = useMemo(() => {
        const amt = Number(loanAmount || 0);
        const inst = Number(monthlyDeduction || 0);
        const months = plannedMonths;
        const remaining = amt - inst * months;
        return Math.max(Number.isFinite(remaining) ? remaining : 0, 0);
    }, [loanAmount, monthlyDeduction, plannedMonths]);

    const grossMonthly = useMemo(
        () => Number(basicSalary || 0) + Number(allowances || 0),
        [basicSalary, allowances]
    );
    const taxMonthly = useMemo(() => computeMonthlyPAYE(grossMonthly), [grossMonthly]);

    // Validation functions
    const validateFullName = (name) => {
        if (!name || name.trim() === '') {
            return 'Full name is required';
        }
        if (name.trim().length < 2) {
            return 'Full name must be at least 2 characters';
        }
        if (!/^[a-zA-Z\s.-]+$/.test(name.trim())) {
            return 'Full name can only contain letters, spaces, dots, and hyphens';
        }
        return '';
    };

    const validateNIC = (nicValue) => {
        if (!nicValue || nicValue.trim() === '') {
            return 'NIC number is required';
        }
        const trimmedNic = nicValue.trim();
        // Sri Lankan NIC validation (old format: 9 digits + V, new format: 12 digits)
        if (!/^(\d{9}[VvXx]|\d{12})$/.test(trimmedNic)) {
            return 'Invalid NIC format. Use 9 digits + V/X or 12 digits';
        }
        return '';
    };

    const validateDateOfBirth = (dob) => {
        if (!dob) {
            return 'Date of birth is required';
        }
        const dobDate = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();

        if (dobDate > today) {
            return 'Date of birth cannot be in the future';
        }
        if (age < 18) {
            return 'Employee must be at least 18 years old';
        }
        if (age > 70) {
            return 'Employee age cannot exceed 70 years';
        }
        return '';
    };

    const validateSalary = (salary) => {
        if (!salary || salary === '') {
            return 'Basic salary is required';
        }
        const numSalary = Number(salary);
        if (isNaN(numSalary)) {
            return 'Basic salary must be a valid number';
        }
        if (numSalary < 0) {
            return 'Basic salary cannot be negative';
        }
        if (numSalary < 15000) {
            return 'Basic salary must be at least LKR 15,000';
        }
        if (numSalary > 1000000) {
            return 'Basic salary cannot exceed LKR 1,000,000';
        }
        return '';
    };

    const validateAllowances = (allowance) => {
        if (allowance === '' || allowance === null || allowance === undefined) {
            return ''; // Allow empty values
        }
        const numAllowance = Number(allowance);
        if (isNaN(numAllowance)) {
            return 'Allowances must be a valid number';
        }
        if (numAllowance < 0) {
            return 'Allowances cannot be negative';
        }
        if (numAllowance > 500000) {
            return 'Allowances cannot exceed LKR 500,000';
        }
        return '';
    };

    const validateBankAccount = (account) => {
        if (!account || account.trim() === '') {
            return 'Bank account number is required';
        }
        const trimmedAccount = account.trim();
        if (!/^\d{8,20}$/.test(trimmedAccount)) {
            return 'Bank account must be 8-20 digits';
        }
        return '';
    };

    const validateLoanAmount = (amount) => {
        if (amount === '' || amount === null || amount === undefined) {
            return ''; // Allow empty values
        }
        const numAmount = Number(amount);
        if (isNaN(numAmount)) {
            return 'Loan amount must be a valid number';
        }
        if (numAmount < 0) {
            return 'Loan amount cannot be negative';
        }
        if (numAmount > 5000000) {
            return 'Loan amount cannot exceed LKR 5,000,000';
        }
        return '';
    };

    const validateMonthlyDeduction = (deduction) => {
        if (deduction === '' || deduction === null || deduction === undefined) {
            return ''; // Allow empty values
        }
        const numDeduction = Number(deduction);
        if (isNaN(numDeduction)) {
            return 'Monthly deduction must be a valid number';
        }
        if (numDeduction < 0) {
            return 'Monthly deduction cannot be negative';
        }
        if (numDeduction > 100000) {
            return 'Monthly deduction cannot exceed LKR 100,000';
        }
        return '';
    };

    const validateLoanDates = () => {
        if (!loanStart && !loanEnd) {
            return ''; // Both empty is fine
        }
        if (loanStart && !loanEnd) {
            return 'Loan end date is required when start date is provided';
        }
        if (!loanStart && loanEnd) {
            return 'Loan start date is required when end date is provided';
        }
        if (loanStart && loanEnd) {
            const start = new Date(loanStart + '-01');
            const end = new Date(loanEnd + '-01');
            if (start >= end) {
                return 'Loan end date must be after start date';
            }
            const today = new Date();
            if (start > today) {
                return 'Loan start date cannot be in the future';
            }
        }
        return '';
    };

    const validate = () => {
        const e = {};

        e.fullName = validateFullName(fullName);
        e.nic = validateNIC(nic);
        e.dob = validateDateOfBirth(dobStr);
        e.basicSalary = validateSalary(basicSalary);
        e.allowances = validateAllowances(allowances);
        e.bankAccount = validateBankAccount(bankAccount);
        e.loanAmount = validateLoanAmount(loanAmount);
        e.monthlyDeduction = validateMonthlyDeduction(monthlyDeduction);
        e.loanDates = validateLoanDates();

        setErrors(e);
        return Object.keys(e).every(key => !e[key]);
    };

    // Real-time validation on field change
    const handleFieldChange = (field, value, validator) => {
        const error = validator(value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSave = async () => {
        if (!validate()) {
            setSubmitError('Please fix all validation errors before saving');
            return;
        }
        setSubmitError('');
        try {
            setLoading(true);
            const payload = {
                employeeId: String(employeeId).trim().toUpperCase(),
                fullName: fullName.trim(),
                dob: dobStr,
                nic: nic.trim(),
                basicSalary: Number(basicSalary || 0),
                allowances: Number(allowances || 0),
                bank: {
                    name: bankName.trim(),
                    account: bankAccount.trim(),
                    branch: bankBranch.trim()
                },
                loan: {
                    amount: Number(loanAmount || 0),
                    monthlyDeduction: Number(monthlyDeduction || 0),
                    startMonth: loanStart,
                    endMonth: loanEnd,
                },
                status,
                epfEligible: epfEligible === 'Yes',
                etfEligible: etfEligible === 'Yes',
            };
            const res = await axios.post('http://localhost:5000/api/employees', payload);
            onSave?.(res.data);
            onClose?.();
        } catch (e) {
            setSubmitError(e?.response?.data?.error || 'Failed to save employee');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
                <div className="modal-header">
                    <h3>Add Employee</h3>
                    <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="modal-body">

                    {/* Personal Info */}
                    <div className="section-title">Personal Information</div>
                    <div className="grid two">
                        <div className="field">
                            <label>Employee ID</label>
                            <input value={employeeId} readOnly />
                        </div>
                        <div className="field">
                            <label>Full Name *</label>
                            <input
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    handleFieldChange('fullName', e.target.value, validateFullName);
                                }}
                                placeholder="Enter full name"
                                className={errors.fullName ? 'error' : ''}
                            />
                            {errors.fullName && <div className="error-text">{errors.fullName}</div>}
                        </div>
                    </div>
                    <div className="grid three">
                        <div className="field">
                            <label>NIC Number *</label>
                            <input
                                value={nic}
                                onChange={(e) => {
                                    setNic(e.target.value);
                                    handleFieldChange('nic', e.target.value, validateNIC);
                                }}
                                placeholder="123456789V or 123456789012"
                                className={errors.nic ? 'error' : ''}
                            />
                            {errors.nic && <div className="error-text">{errors.nic}</div>}
                        </div>
                        <div className="field">
                            <label>Date of Birth *</label>
                            <input
                                type="date"
                                value={dobStr}
                                onChange={(e) => {
                                    setDobStr(e.target.value);
                                    handleFieldChange('dob', e.target.value, validateDateOfBirth);
                                }}
                                className={errors.dob ? 'error' : ''}
                            />
                            {errors.dob && <div className="error-text">{errors.dob}</div>}
                        </div>
                        <div className="field">
                            <label>Age</label>
                            <input value={age} readOnly />
                        </div>
                    </div>

                    {/* Employment & Salary */}
                    
                    <div className="grid three">
                        <div className="field">
                            <label>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option>Active</option>
                                <option>Closed</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Basic Salary (LKR) *</label>
                            <input
                                type="number"
                                min="0"
                                value={basicSalary}
                                onChange={(e) => {
                                    setBasicSalary(e.target.value);
                                    handleFieldChange('basicSalary', e.target.value, validateSalary);
                                }}
                                placeholder="15000"
                                className={errors.basicSalary ? 'error' : ''}
                            />
                            {errors.basicSalary && <div className="error-text">{errors.basicSalary}</div>}
                        </div>
                        <div className="field">
                            <label>Allowances (LKR)</label>
                            <input
                                type="number"
                                min="0"
                                value={allowances}
                                onChange={(e) => {
                                    setAllowances(e.target.value);
                                    handleFieldChange('allowances', e.target.value, validateAllowances);
                                }}
                                placeholder="0"
                                className={errors.allowances ? 'error' : ''}
                            />
                            {errors.allowances && <div className="error-text">{errors.allowances}</div>}
                        </div>
                    </div>
                    <div className="grid three">
                        <div className="field">
                            <label>Monthly PAYE (auto)</label>
                            <input value={taxMonthly.toFixed(2)} readOnly />
                        </div>
                        <div className="field">
                            <label>EPF Eligibility</label>
                            <select value={epfEligible} onChange={(e) => setEpfEligible(e.target.value)}>
                                <option>Yes</option>
                                <option>No</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>ETF Eligibility</label>
                            <select value={etfEligible} onChange={(e) => setEtfEligible(e.target.value)}>
                                <option>Yes</option>
                                <option>No</option>
                            </select>
                        </div>
                    </div>

                    {/* Bank */}
                    <br />
                    <div className="section-title">Bank Account Details</div>
                    <div className="grid three">
                        <div className="field">
                            <label>Bank Name</label>
                            <input value={bankName} onChange={(e) => setBankName(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Account Number *</label>
                            <input
                                value={bankAccount}
                                onChange={(e) => {
                                    setBankAccount(e.target.value);
                                    handleFieldChange('bankAccount', e.target.value, validateBankAccount);
                                }}
                                placeholder="1234567890123456"
                                className={errors.bankAccount ? 'error' : ''}
                            />
                            {errors.bankAccount && <div className="error-text">{errors.bankAccount}</div>}
                        </div>
                        <div className="field">
                            <label>Branch</label>
                            <input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} />
                        </div>
                    </div>

                    {/* Loan */}
                    <div className="section-title">Loan Information</div>
                    <div className="grid three">
                        <div className="field">
                            <label>Loan Amount (LKR)</label>
                            <input
                                type="number"
                                min="0"
                                value={loanAmount}
                                onChange={(e) => {
                                    setLoanAmount(e.target.value);
                                    handleFieldChange('loanAmount', e.target.value, validateLoanAmount);
                                }}
                                placeholder="0"
                                className={errors.loanAmount ? 'error' : ''}
                            />
                            {errors.loanAmount && <div className="error-text">{errors.loanAmount}</div>}
                        </div>
                        <div className="field">
                            <label>Monthly Deduction (LKR)</label>
                            <input
                                type="number"
                                min="0"
                                value={monthlyDeduction}
                                onChange={(e) => {
                                    setMonthlyDeduction(e.target.value);
                                    handleFieldChange('monthlyDeduction', e.target.value, validateMonthlyDeduction);
                                }}
                                placeholder="0"
                                className={errors.monthlyDeduction ? 'error' : ''}
                            />
                            {errors.monthlyDeduction && <div className="error-text">{errors.monthlyDeduction}</div>}
                        </div>
                        <div className="field">
                            <label>Remaining Balance (auto)</label>
                            <input value={Number.isFinite(remainingBalance) ? remainingBalance.toFixed(2) : ''} readOnly />
                        </div>
                    </div>
                    <br />
                    <div className="grid three">
                        <div className="field">
                            <label>Loan Start (YYYY-MM)</label>
                            <input
                                type="month"
                                value={loanStart}
                                onChange={(e) => {
                                    setLoanStart(e.target.value);
                                    handleFieldChange('loanDates', e.target.value, validateLoanDates);
                                }}
                                className={errors.loanDates ? 'error' : ''}
                            />
                        </div>
                        <div className="field">
                            <label>Loan End (YYYY-MM)</label>
                            <input
                                type="month"
                                value={loanEnd}
                                onChange={(e) => {
                                    setLoanEnd(e.target.value);
                                    handleFieldChange('loanDates', e.target.value, validateLoanDates);
                                }}
                                className={errors.loanDates ? 'error' : ''}
                            />
                        </div>
                        <div className="field">
                            <label>Planned Months (auto)</label>
                            <input value={plannedMonths} readOnly />
                        </div>
                    </div>
                    {errors.loanDates && <div className="error-text" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>{errors.loanDates}</div>}

                </div>
                {submitError && <div className="error-text" style={{ padding: '10px 20px', backgroundColor: '#fee', color: '#c33' }}>{submitError}</div>}
                <div className="modal-footer">
                    <button className="btn ghost" onClick={onClose}>Cancel</button>
                    <button className="btn primary" onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Employee'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
