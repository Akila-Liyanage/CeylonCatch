import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUser, FaEnvelope, FaClock, FaServer, FaIdBadge } from "react-icons/fa";
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogins = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/login-history?limit=1000");
        setLogins(res.data.logins);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching login history:", err);
        setLoading(false);
      }
    };
    fetchLogins();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <p className="admin-loading-text">Loading login history...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1 className="admin-title">Admin Dashboard - User Login History</h1>
        </div>
      </header>

      {/* Table */}
      <div className="admin-container">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Recent Login Activities</h2>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr className="admin-table-header">
                  <th>User</th>
                  <th>Email</th>
                  <th>User Type</th>
                  <th>IP Address</th>
                  <th>Login Time</th>
                </tr>
              </thead>
              <tbody>
                {logins.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-no-data">
                      No login history found.
                    </td>
                  </tr>
                ) : (
                  logins.map((login, idx) => (
                    <tr key={idx} className="admin-table-row">
                      {/* User Column - shows username part of email */}
                      <td className="admin-table-cell admin-table-cell-user">
                        <div className="admin-flex">
                          <FaUser className="admin-icon admin-icon-user" />
                          {login.email ? login.email.split("@")[0] : "N/A"}
                        </div>
                      </td>
                      
                      {/* Email Column - shows full email */}
                      <td className="admin-table-cell admin-table-cell-email">
                        <div className="admin-flex">
                          <FaEnvelope className="admin-icon admin-icon-email" />
                          {login.email || "N/A"}
                        </div>
                      </td>
                      
                      {/* User Type Column */}
                      <td className="admin-table-cell admin-table-cell-type">
                        <div className="admin-flex">
                          <FaIdBadge className="admin-icon admin-icon-type" />
                          {login.userType || "N/A"}
                        </div>
                      </td>
                      
                      {/* IP Address Column */}
                      <td className="admin-table-cell admin-table-cell-ip">
                        <div className="admin-flex">
                          <FaServer className="admin-icon admin-icon-ip" />
                          {login.ipAddress || "N/A"}
                        </div>
                      </td>
                      
                      {/* Login Time Column */}
                      <td className="admin-table-cell admin-table-cell-time">
                        <div className="admin-flex">
                          <FaClock className="admin-icon admin-icon-time" />
                          {login.loginTime
                            ? new Date(login.loginTime).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard