import Employee from '../../models/finance.model/Employee.model.js';

export const createEmployee = async (req, res) => {
    try {
        const payload = {
            employeeId: String(req.body.employeeId || '').trim().toUpperCase(),
            fullName: req.body.fullName,
            dob: req.body.dob,
            nic: req.body.nic,
            basicSalary: Number(req.body.basicSalary || 0),
            allowances: Number(req.body.allowances || 0),
            bank: req.body.bank || {},
            loan: {
                amount: Number(req.body?.loan?.amount || 0),
                monthlyDeduction: Number(req.body?.loan?.monthlyDeduction || 0),
                startMonth: req.body?.loan?.startMonth,
                endMonth: req.body?.loan?.endMonth,
            },
            status: req.body.status || 'Active',
            epfEligible: !!req.body.epfEligible,
            etfEligible: !!req.body.etfEligible,
        };

        if (!payload.employeeId || !payload.fullName || !payload.basicSalary) {
            return res.status(400).json({ error: 'employeeId, fullName, basicSalary are required' });
        }

        const created = await Employee.create(payload);
        res.status(201).json(created);
    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({ error: 'Employee ID already exists' });
        }
        res.status(500).json({ error: err.message });
    }
};

export const getEmployee = async (req, res) => {
    try {
        const emp = await Employee.findOne({ employeeId: req.params.employeeId });
        if (!emp) return res.status(404).json({ error: 'Employee not found' });
        res.json(emp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const listEmployees = async (_req, res) => {
    try {
        const emps = await Employee.find().sort({ createdAt: -1 });
        res.json(emps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


