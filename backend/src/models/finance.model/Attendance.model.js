import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, index: true },
    otHours: { type: Number, default: 0 },
    noPayLeaves: { type: Number, default: 0 },
    halfDayLeaves: { type: Number, default: 0 },
    specialHolidaysWorked: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    incentives: { type: Number, default: 0 },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
}, { timestamps: true });

AttendanceSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Attendance', AttendanceSchema);



