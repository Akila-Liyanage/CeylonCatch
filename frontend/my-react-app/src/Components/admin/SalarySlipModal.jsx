import React, { useState } from 'react';
import axios from 'axios';
import './admin-users.css';
import { jsPDF } from 'jspdf';
import logoUrl from '../../assets/images/logo.png';

const fmt = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;//convert to rupees

const SalarySlipModal = ({ open, onClose }) => {//store
    const [employeeId, setEmployeeId] = useState('');
    const [month, setMonth] = useState(''); // YYYY-MM
    const [slip, setSlip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paying, setPaying] = useState(false);
    const [payMsg, setPayMsg] = useState('');

    const handleCalculate = async () => {
        setError('');
        setSlip(null); //holds the calculated salary slip data (from backend)
        if (!employeeId || !month) {
            setError('Employee ID and Month are required');
            return;
        }
        try {
            setLoading(true);
            const [y, m] = month.split('-').map(Number);
            const id = String(employeeId).trim().toUpperCase();
            const res = await axios.post('http://localhost:5000/api/finance/payroll/calculate-slip', {
                employeeId: id,
                month: m,
                year: y,
            });
            setSlip(res.data);
        } catch (e) {
            setError(e?.response?.data?.error || 'Failed to calculate');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        if (!slip) return;
        setPayMsg('');
        try {
            setPaying(true);
            const res = await axios.post('http://localhost:5000/api/finance/salaries', {
                employeeId: slip.employee?.employeeId,
                role: 'employee',
                amount: Number(slip?.totals?.netPay || 0),
                month: slip?.period?.month,
                year: slip?.period?.year,
            });
            if (res?.data?._id) {
                setPayMsg('Salary marked as paid.');
            } else {
                setPayMsg('Payment recorded.');
            }
        } catch (e) {
            setPayMsg(e?.response?.data?.error || 'Failed to record payment');
        } finally {
            setPaying(false);
        }
    };

    const downloadPdf = async () => {
        if (!slip) return;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 40;
        let y = margin;
        const lineGap = 20;

        const textRight = (t, x, yy, size = 12) => { //number,horizontal position,vertical position(print right text)
            doc.setFontSize(size);
            doc.text(String(t ?? ''), x, yy, { align: 'right' });
        };
        const text = (t, x, yy, size = 12) => {//print left text
            doc.setFontSize(size);
            doc.text(String(t ?? ''), x, yy);
        };
        const hr = (yy) => { //draw hr line
            doc.setLineWidth(0.8);
            doc.line(margin, yy, pageWidth - margin, yy);
        };
        const fmtNum = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

        const toDataURL = (url) => new Promise((resolve) => {//image url to base 64 data
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width; canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = url;
        });

        const logoData = await toDataURL(logoUrl);
        
        // Header with logo and template-like layout
        const logoW = 130, logoH = 130;
        doc.addImage(logoData, 'PNG',  margin , y - 45, logoW, logoH);
        doc.setFontSize(26);
        doc.text('CeylonCatch Ltd', pageWidth / 2, y + 10, { align: 'center' });
        doc.setFontSize(11);
        doc.text('[Chilaw Fish Market, Chilaw, Sri Lanka]', pageWidth / 2, y + 28, { align: 'center' });
        y += 56;
        doc.setFontSize(18);
        doc.text('Salary Slip', pageWidth / 2, y, { align: 'center' });
        y += 18;
        hr(y); y += 12;

        const periodStr = `${slip?.period?.month}/${slip?.period?.year}`;
        text(`Employee Name: ${slip?.employee?.fullName || ''}`, margin, y, 12); y += lineGap - 2;
         text(`Designation: -`, margin, y, 12); y += lineGap - 2;
        text(`Month: ${periodStr}          Year: ${slip?.period?.year}`, margin, y, 12); y += lineGap;
        hr(y); y += 12;

        // Table per uploaded format
        const tableLeft = margin;
        const tableRight = pageWidth - margin;
        const mid = (tableLeft + tableRight) / 2;
        const rowH = 22;
        const drawHeaderCell = (label, x, width) => {
            doc.setFillColor(240, 240, 240);
            doc.rect(x, y, width, rowH, 'F');
            doc.setLineWidth(0.6);
            doc.rect(x, y, width, rowH);
            doc.setFontSize(12);
            doc.text(label, x + 8, y + 15);
        };
        drawHeaderCell('Earnings', tableLeft, mid - tableLeft);
        drawHeaderCell('Deductions', mid, tableRight - mid);
        y += rowH;

        const drawRow = (labelLeft, valueLeft, labelRight, valueRight) => {
            // Left cell
            doc.rect(tableLeft, y, mid - tableLeft, rowH);
            doc.text(labelLeft, tableLeft + 8, y + 15);
            textRight(valueLeft, mid - 8, y + 15);
            // Right cell
            doc.rect(mid, y, tableRight - mid, rowH);
            doc.text(labelRight, mid + 8, y + 15);
            textRight(valueRight, tableRight - 8, y + 15);
            y += rowH;
        };

        drawRow('Basic & DA', fmtNum(slip?.breakdown?.basic), 'Provident Fund (EPF 8%)', fmtNum(slip?.breakdown?.epfEmployee));
        drawRow('HRA / Allowances', fmtNum(slip?.breakdown?.allowances), 'PAYE / Tax', fmtNum(slip?.breakdown?.paye));
        drawRow('Conveyance / OT', fmtNum(slip?.breakdown?.otPay), 'Loan', fmtNum(slip?.breakdown?.loanMonthly));
        drawRow('Special Holidays Worked Bonus', fmtNum(slip?.breakdown?.specialHolidayBonus), 'No-Pay + Half-Day', fmtNum((slip?.breakdown?.noPayDeduction || 0) + (slip?.breakdown?.halfDayDeduction || 0)));
        drawRow('Bonus / Incentives', fmtNum((slip?.breakdown?.bonus || 0) + (slip?.breakdown?.incentives || 0)), '-', '-');

        // Totals row
        doc.setFillColor(240, 240, 240);
        doc.rect(tableLeft, y, mid - tableLeft, rowH, 'F');
        doc.rect(mid, y, tableRight - mid, rowH, 'F');
        doc.rect(tableLeft, y, mid - tableLeft, rowH);
        doc.rect(mid, y, tableRight - mid, rowH);
        doc.text('Total Addition', tableLeft + 8, y + 15);
        textRight(fmtNum(slip?.totals?.grossEarnings), mid - 8, y + 15);
        doc.text('Total Deduction', mid + 8, y + 15);
        textRight(fmtNum(slip?.totals?.totalDeductions), tableRight - 8, y + 15);
        y += rowH;

        // NET Salary row (highlight)
        doc.setFillColor(224, 224, 224);
        doc.rect(tableLeft, y, tableRight - tableLeft, rowH, 'F');
        doc.rect(tableLeft, y, tableRight - tableLeft, rowH);
        doc.setFontSize(13);
        doc.text('NET Salary', tableLeft + 8, y + 15);
        textRight(fmtNum(slip?.totals?.netPay), tableRight - 8, y + 15);
        y += rowH + 16;

        // Footer fields per template
        doc.setFontSize(10);
        doc.text('Amount in words: _______________________________________________', margin, y);
        y += lineGap - 4;
        doc.text(`Cheque #: ____________________          Bank Name Here: ${String(slip?.employee?.bank?.name || '')}`, margin, y);
        y += lineGap - 4;
        doc.text('Dated As: ____________________', margin, y);
        y += lineGap + 10;

        // Signature lines
        const sigY = y + 20;
        doc.line(margin, sigY, margin + 200, sigY);
        doc.text('Employee Signature', margin + 100, sigY + 14, { align: 'center' });
        doc.line(pageWidth - margin - 200, sigY, pageWidth - margin, sigY);
        doc.text('Director', pageWidth - margin - 100, sigY + 14, { align: 'center' });

        const fileName = `SalarySlip_${slip?.employee?.employeeId || 'EMP'}_${periodStr}.pdf`;
        doc.save(fileName);
    };

    if (!open) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal">
                <div className="modal-header">
                    <h3>Generate Salary Slip</h3>
                    <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="modal-body">
                    <div className="grid two">
                        <div className="field" >
                            <label>Employee ID</label>
                            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP-..." />
                        </div>
                        <div className="field">
                            <label>Month</label>
                            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                        </div>
                    </div>
                    <button className="btn primary" onClick={handleCalculate} disabled={loading}>
                        {loading ? 'Calculating...' : 'Calculate'}
                    </button>
                    {error && <div className="error-text" style={{ marginTop: 8 }}>{error}</div>}

                    {slip && (
                        <div style={{ marginTop: 16 }}>
                            <h4 className='ftext'>Salary Slip - {slip.employee?.fullName} ({slip.employee?.employeeId})</h4>
                            <div className='ftext'>Period: {slip.period?.month}/{slip.period?.year}</div>
                            <div className="grid two" style={{ marginTop: 12 }}>
                                <div>
                                    <strong className='ftext'>Earnings</strong>
                                    <div className='ftext'>Basic: {fmt(slip.breakdown?.basic)}</div>
                                    <div className='ftext'>Allowances: {fmt(slip.breakdown?.allowances)}</div>
                                    <div className='ftext'>OT Pay: {fmt(slip.breakdown?.otPay)}</div>
                                    <div className='ftext'>Special Holiday Bonus: {fmt(slip.breakdown?.specialHolidayBonus)}</div>
                                    <div className='ftext'>Bonus: {fmt(slip.breakdown?.bonus)}</div>
                                    <div className='ftext'>Incentives: {fmt(slip.breakdown?.incentives)}</div>
                                    <div className='ftext' style={{ marginTop: 6 }}>Gross Earnings: {fmt(slip.totals?.grossEarnings)}</div>
                                </div>
                                <div>
                                    <strong className='ftext'>Deductions</strong>
                                    <div className='ftext'>EPF (Employee 8%): {fmt(slip.breakdown?.epfEmployee)}</div>
                                    <div className='ftext'>PAYE: {fmt(slip.breakdown?.paye)}</div>
                                    <div className='ftext'>No-Pay Leave: {fmt(slip.breakdown?.noPayDeduction)}</div>
                                    <div className='ftext'>Half-Day Leave: {fmt(slip.breakdown?.halfDayDeduction)}</div>
                                    <div className='ftext'>Loan Deduction: {fmt(slip.breakdown?.loanMonthly)}</div>
                                    <div className='ftext' style={{ marginTop: 6 }}>Total Deductions: {fmt(slip.totals?.totalDeductions)}</div>
                                </div>
                            </div>
                            <div className='ftext' style={{ marginTop: 12, fontSize: 16, fontWeight: 700 }}>Net Pay: {fmt(slip.totals?.netPay)}</div>
                            <div className='ftext' style={{ marginTop: 12 }}>
                                <strong className='ftext'>Employer Contributions (Info)</strong>
                                <div className='ftext'>EPF (Employer 12%): {fmt(slip.employerContrib?.epfEmployer)}</div>
                                <div className='ftext'>ETF (Employer 3%): {fmt(slip.employerContrib?.etfEmployer)}</div>
                            </div>
                            <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button className="btn" onClick={downloadPdf}>Download PDF</button>
                                <button className="btn primary" onClick={handlePay} disabled={paying}>{paying ? 'Paying...' : 'Pay'}</button>
                                {payMsg && <span style={{ fontSize: 12 }}>{payMsg}</span>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn ghost" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default SalarySlipModal;


