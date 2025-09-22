import Attendance from '../../models/finance.model/Attendance.model.js';

export const upsertAttendance = async (req, res) => {
    try {
        const { employeeId, month, year } = req.body;
        if (!employeeId || !month || !year) {
            return res.status(400).json({ error: 'employeeId, month, year are required' });
        }
        const normalizedId = String(employeeId).trim().toUpperCase();
        const payload = {
            employeeId: normalizedId,
            month,
            year,
            otHours: Number(req.body.otHours || 0),
            noPayLeaves: Number(req.body.noPayLeaves || 0),
            halfDayLeaves: Number(req.body.halfDayLeaves || 0),
            specialHolidaysWorked: Number(req.body.specialHolidaysWorked || 0),
            bonus: Number(req.body.bonus || 0),
            incentives: Number(req.body.incentives || 0),
        };

        const attendance = await Attendance.findOneAndUpdate(
            { employeeId: normalizedId, month, year },
            { $set: payload },
            { new: true, upsert: true }
        );
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAttendance = async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;
        const query = {};
        if (employeeId) query.employeeId = employeeId;
        if (month) query.month = Number(month);
        if (year) query.year = Number(year);
        const rows = await Attendance.find(query).sort({ year: -1, month: -1, createdAt: -1 });
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


