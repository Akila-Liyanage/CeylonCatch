import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router'
import './auth.css'

const Signup = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('buyer');
    // buyer fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contact, setContact] = useState('');
    const [address, setAddress] = useState('');
    const [btype, setBtype] = useState('Regular');
    // seller fields
    const [sName, setSName] = useState('');
    const [gmail, setGmail] = useState('');
    const [sPassword, setSPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (role === 'buyer') {
                const res = await axios.post('http://localhost:5000/api/users/buyerregister', { name, email, password, contact, address, btype });
                const buyer = res.data?.buyer;
                localStorage.setItem('authUser', JSON.stringify({ id: buyer?._id, name: buyer?.name, role: 'buyer' }));
            } else {
                const res = await axios.post('http://localhost:5000/api/users/sellerregister', { name: sName, gmail, password: sPassword });
                const seller = res.data?.seller;
                localStorage.setItem('authUser', JSON.stringify({ id: seller?._id, name: seller?.name || seller?.gmail, role: 'seller' }));
            }
            navigate('/');
        } catch (err) {
            setError(err?.response?.data?.error || 'Signup failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header"><h2>Create Account</h2></div>
                <div className="auth-body">
                    <div className="role-tabs">
                        <button type="button" className={`role-tab ${role==='buyer'?'active':''}`} onClick={() => setRole('buyer')}>Buyer</button>
                        <button type="button" className={`role-tab ${role==='seller'?'active':''}`} onClick={() => setRole('seller')}>Seller</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        {role === 'buyer' ? (
                            <>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input className="input" value={name} onChange={(e)=>setName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Contact</label>
                                    <input className="input" value={contact} onChange={(e)=>setContact(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <input className="input" value={address} onChange={(e)=>setAddress(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Buyer Type</label>
                                    <select className="select" value={btype} onChange={(e)=>setBtype(e.target.value)}>
                                        <option>Regular</option>
                                        <option>Wholesale</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input className="input" value={sName} onChange={(e)=>setSName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Gmail</label>
                                    <input className="input" type="email" value={gmail} onChange={(e)=>setGmail(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input className="input" type="password" value={sPassword} onChange={(e)=>setSPassword(e.target.value)} required />
                                </div>
                            </>
                        )}
                        {error && <div className="error">{error}</div>}
                        <button className="submit" type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                        <div className="hint">Already have an account? <Link className="link" to="/login">Login</Link></div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Signup


