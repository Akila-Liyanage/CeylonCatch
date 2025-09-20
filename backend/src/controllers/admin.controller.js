import UserLogin from "../models/UserLogin.model.js";

export const getUserLoginHistory = async (req, res) => {
  const { email } = req.params;
  const { limit = 10, page = 1 } = req.query;
  try {
    const logins = await UserLogin.find({ email }).sort({ loginTime: -1 }).limit(parseInt(limit)).skip((page - 1) * limit);
    const total = await UserLogin.countDocuments({ email });
    res.json({ logins, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ err: "Server error" });
  }
};
export const getAllLoginHistory = async (req, res) => {
  const { limit = 50, page = 1, userType, startDate, endDate } = req.query;
  try {
    let query = {};
    if (userType) query.userType = userType;
    if (startDate || endDate) {
      query.loginTime = {};
      if (startDate) query.loginTime.$gte = new Date(startDate);
      if (endDate) query.loginTime.$lte = new Date(endDate);
    }
    const logins = await UserLogin.find(query)
      .sort({ loginTime: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);
    const total = await UserLogin.countDocuments(query);
    res.json({ logins, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ err: "Server error" });
  }
};

