import Employee from '../../models/finance.model/Employee.model.js';
import Attendance from '../../models/finance.model/Attendance.model.js';

// Basic Sri Lanka payroll rules (adjust if your company policy differs):
// - EPF Employee 8%, Employer 12% (employee portion reduces net)
// - ETF Employer 3% (does not reduce employee net)
// - PAYE tax via existing brackets client uses; here we include simple brackets as fallback
const SL_MONTHLY_TAX_BRACKETS = [
    { upto: 100000, rate: 0.06 },
    { upto: 141667, rate: 0.12 },
    { upto: 183333, rate: 0.18 },
    { upto: 225000, rate: 0.24 },
    { upto: 266667, rate: 0.30 },
    { upto: Infinity, rate: 0.36 },
];

const calcTax = (grossTaxable) => {
    let remaining = Math.max(grossTaxable, 0);
    let prev = 0;
    let tax = 0;
    for (const b of SL_MONTHLY_TAX_BRACKETS) {
        const cap = b.upto;
        const amt = Math.max(Math.min(remaining, cap - prev), 0);
        if (amt <= 0) break;
        tax += amt * b.rate;
        remaining -= amt;
        prev = cap;
    }
    return Math.max(tax, 0);
};

// Placeholder policy numbers; adjust as needed.
const OT_HOURLY_RATE_FACTOR = 1.5; // OT = 1.5x hourly
const WORKING_DAYS_PER_MONTH = 26;
const WORKING_HOURS_PER_DAY = 8;

const calcFromEmployeeAndAttendance = (emp, att) => {
    const basic = Number(emp.basicSalary || 0);
    const allowances = Number(emp.allowances || 0);
    const grossBase = basic + allowances;

    // Hourly rate derived from basic
    const hourlyRate = basic / (WORKING_DAYS_PER_MONTH * WORKING_HOURS_PER_DAY);
    const otPay = Number(att?.otHours || 0) * hourlyRate * OT_HOURLY_RATE_FACTOR;

    // Leave deductions (No-Pay as full day, Half-Day as half day)
    const perDayRate = basic / WORKING_DAYS_PER_MONTH;
    const noPayDeduction = Number(att?.noPayLeaves || 0) * perDayRate;
    const halfDayDeduction = Number(att?.halfDayLeaves || 0) * (perDayRate / 2);

    // Holiday bonus: Special holidays worked paid at 2x per day as bonus
    const specialHolidayBonus = Number(att?.specialHolidaysWorked || 0) * perDayRate * 2;

    // Additional bonuses
    const bonus = Number(att?.bonus || 0);
    const incentives = Number(att?.incentives || 0);

    // EPF/ETF
    const epfEmployee = emp.epfEligible ? grossBase * 0.08 : 0;
    const epfEmployer = emp.epfEligible ? grossBase * 0.12 : 0;
    const etfEmployer = emp.etfEligible ? grossBase * 0.03 : 0;

    // Taxable income: simplistic assumption → grossBase + OT + bonuses - no-pay/half-day
    const taxableIncome = Math.max(
        grossBase + otPay + bonus + incentives + specialHolidayBonus - noPayDeduction - halfDayDeduction,
        0
    );
    const paye = calcTax(taxableIncome);

    // Loan deduction (flat monthly)
    const loanMonthly = Number(emp?.loan?.monthlyDeduction || 0);

    const grossEarnings = grossBase + otPay + specialHolidayBonus + bonus + incentives;
    const totalDeductions = epfEmployee + paye + noPayDeduction + halfDayDeduction + loanMonthly;
    const netPay = Math.max(grossEarnings - totalDeductions, 0);

    return {
        breakdown: {
            basic,
            allowances,
            otPay,
            specialHolidayBonus,
            bonus,
            incentives,
            noPayDeduction,
            halfDayDeduction,
            epfEmployee,
            epfEmployer,
            etfEmployer,
            paye,
            loanMonthly,
        },
        totals: {
            grossEarnings,
            totalDeductions,
            netPay,
            taxableIncome,
        },
    };
};

export const calculateSalarySlip = async (req, res) => {
    try {
        const { employeeId, month, year } = req.body;
        if (!employeeId || !month || !year) {
            return res.status(400).json({ error: 'employeeId, month, year are required' });
        }
        const normalizedId = String(employeeId).trim().toUpperCase();
        const emp = await Employee.findOne({ employeeId: normalizedId });
        if (!emp) return res.status(404).json({ error: 'Employee not found' });
        const att = await Attendance.findOne({ employeeId: normalizedId, month, year });
        const calc = calcFromEmployeeAndAttendance(emp, att || {});

        const slip = {
            employee: {
                employeeId: emp.employeeId,
                fullName: emp.fullName,
                epfEligible: emp.epfEligible,
                etfEligible: emp.etfEligible,
                bank: emp.bank || {},
            },
            period: { month, year },
            attendance: att || {},
            ...calc,
            // Employer contributions are informational for slip
            employerContrib: {
                epfEmployer: calc.breakdown.epfEmployer,
                etfEmployer: calc.breakdown.etfEmployer,
            },
        };

        res.json(slip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


