import React, { useState } from 'react';
import axios from 'axios';//send http reuests to backend(get... )
import './admin-users.css';

const AddAttendanceModal = ({ open, onClose, onSaved }) => { //control show or hide,close,save 
    const [employeeId, setEmployeeId] = useState('');
    const [month, setMonth] = useState(''); // YYYY-MM
    const [otHours, setOtHours] = useState('');
    const [noPayLeaves, setNoPayLeaves] = useState('');
    const [halfDayLeaves, setHalfDayLeaves] = useState('');
    const [specialHolidaysWorked, setSpecialHolidaysWorked] = useState('');
    const [bonus, setBonus] = useState('');
    const [incentives, setIncentives] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setError('');
        if (!employeeId || !month) {
            setError('Employee ID and Month are required');
            return;
        }
        try {
            setLoading(true);
            const [y, m] = month.split('-').map(Number)
            const id = String(employeeId).trim().toUpperCase();
            const res = await axios.post('http://localhost:5000/api/attendance', {
                employeeId: id,
                month: m,
                year: y,
                otHours: Number(otHours || 0),
                noPayLeaves: Number(noPayLeaves || 0),
                halfDayLeaves: Number(halfDayLeaves || 0),
                specialHolidaysWorked: Number(specialHolidaysWorked || 0),
                bonus: Number(bonus || 0),
                incentives: Number(incentives || 0),
            });
            onSaved?.(res.data);
            onClose?.();
        } catch (e) {
            setError(e?.response?.data?.error || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
                <div className="modal-header">
                    <h3>Add Attendance Entry</h3>
                    <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="modal-body">
                    <div className="grid two">
                        <div className="field">
                            <label>Employee ID</label>
                            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP-..." />
                        </div>
                        <div className="field">
                            <label>Month</label>
                            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid three">
                        <div className="field">
                            <label>OT Hours</label>
                            <input type="number" min="0" value={otHours} onChange={(e) => setOtHours(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>No-Pay Leaves</label>
                            <input type="number" min="0" value={noPayLeaves} onChange={(e) => setNoPayLeaves(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Half-Day Leaves</label>
                            <input type="number" min="0" value={halfDayLeaves} onChange={(e) => setHalfDayLeaves(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid three">
                        <div className="field">
                            <label>Special Holidays Worked</label>
                            <input type="number" min="0" value={specialHolidaysWorked} onChange={(e) => setSpecialHolidaysWorked(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Bonus</label>
                            <input type="number" min="0" value={bonus} onChange={(e) => setBonus(e.target.value)} />
                        </div>
                        <div className="field">
                            <label>Incentives</label>
                            <input type="number" min="0" value={incentives} onChange={(e) => setIncentives(e.target.value)} />
                        </div>
                    </div>
                    {error && <div className="error-text">{error}</div>}
                </div>
                <div className="modal-footer">
                    <button className="btn ghost" onClick={onClose}>Cancel</button>
                    <button className="btn primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
            </div>
        </div>
    );
};

export default AddAttendanceModal;


