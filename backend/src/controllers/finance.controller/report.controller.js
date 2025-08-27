const Report = require("../../models/finance.model/Report.model");

// Generate report
exports.generateReport = async (req, res) => {
  try {
    const { type, period, data } = req.body;
    const report = new Report({
      type,
      period,
      data,
      generatedBy: req.user.id
    });
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all reports
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
