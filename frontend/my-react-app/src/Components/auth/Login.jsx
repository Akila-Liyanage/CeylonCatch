import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router'
import './auth.css'

const Login = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('buyer'); // 'buyer' | 'seller'
    const [email, setEmail] = useState('');
    const [gmail, setGmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (role === 'buyer') {
                const res = await axios.post('http://localhost:5000/api/users/buyerlogin', { email, password });
                const buyer = res.data?.buyer;
                localStorage.setItem('authUser', JSON.stringify({ id: buyer?._id, name: buyer?.name, role: 'buyer' }));
            } else {
                const res = await axios.post('http://localhost:5000/api/users/sellerlogin', { gmail, password });
                const seller = res.data?.seller;
                localStorage.setItem('authUser', JSON.stringify({ id: seller?._id, name: seller?.name || seller?.gmail, role: 'seller' }));
            }
            navigate('/');
        } catch (err) {
            setError(err?.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header"><h2>Login</h2></div>
                <div className="auth-body">
                    <div className="role-tabs">
                        <button type="button" className={`role-tab ${role==='buyer'?'active':''}`} onClick={() => setRole('buyer')}>Buyer</button>
                        <button type="button" className={`role-tab ${role==='seller'?'active':''}`} onClick={() => setRole('seller')}>Seller</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        {role === 'buyer' ? (
                            <div className="form-group">
                                <label>Email</label>
                                <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>Gmail</label>
                                <input className="input" type="email" value={gmail} onChange={(e)=>setGmail(e.target.value)} required />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Password</label>
                            <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                        </div>
                        {error && <div className="error">{error}</div>}
                        <button className="submit" type="submit" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <div className="hint">Don't have an account? <Link className="link" to="/signup">Sign up</Link></div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login


