const Salary = require("../../models/finance.model/Salary.model");

// Pay salary
exports.paySalary = async (req, res) => {
  try {
    const salary = new Salary({ ...req.body, status: "paid", paidDate: new Date() });
    await salary.save();
    res.json(salary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all salaries
exports.getSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find();
    res.json(salaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
