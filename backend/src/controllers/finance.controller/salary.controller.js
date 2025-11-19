import Salary from '../../models/finance.model/Salary.model.js';

// Pay salary
export const paySalary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    // Check if salary is already paid for this employee and month/year
    const existingSalary = await Salary.findOne({
      employeeId: employeeId,
      month: month,
      year: year,
      status: 'paid'
    });

    if (existingSalary) {
      return res.status(409).json({
        error: 'Salary already paid for this employee and month',
        existingSalary: existingSalary
      });
    }

    const salary = new Salary({ ...req.body, status: "paid", paidDate: new Date() });
    await salary.save();
    res.json(salary);
  } catch (err) {
    // Handle unique constraint violation
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Salary already paid for this employee and month',
        details: 'Duplicate entry detected'
      });
    }
    res.status(500).json({ error: err.message });
  }
};

// Get all salaries with optional filtering
export const getSalaries = async (req, res) => {
  try {
    const { employeeId, month, year, status } = req.query;

    // Build filter object
    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;

    const salaries = await Salary.find(filter).sort({ createdAt: -1 });
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
