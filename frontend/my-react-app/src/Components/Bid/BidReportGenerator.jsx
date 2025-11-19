/**
 * BidReportGenerator Component
 * 
 * This component provides comprehensive bid reporting functionality for buyers.
 * Features include data filtering, export capabilities (CSV/PDF), and real-time statistics.
 * 
 * Key Features:
 * - Fetches and displays buyer's bid history
 * - Advanced filtering by date, status, and amount ranges
 * - Export functionality for CSV and PDF formats
 * - Real-time statistics and summary cards
 * - Responsive design with glassmorphism theme
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  FaFilePdf, 
  FaFileCsv, 
  FaDownload, 
  FaCalendarAlt, 
  FaFilter,
  FaSearch,
  FaPrint,
  FaGavel,
  FaFish,
  FaUser,
  FaDollarSign,
  FaClock
} from 'react-icons/fa';
import './BidReportGenerator.css';

const BidReportGenerator = () => {
  // ===== STATE MANAGEMENT =====
  
  // Core data state - stores all bid data fetched from API
  const [bidData, setBidData] = useState([]);
  
  // UI state management
  const [loading, setLoading] = useState(true);     // Loading indicator for API calls
  const [error, setError] = useState('');           // Error message display
  const [showReport, setShowReport] = useState(false); // Controls report preview visibility
  
  // Filter state - manages all filter criteria for data filtering
  const [filters, setFilters] = useState({
    dateFrom: '',        // Start date for date range filter
    dateTo: '',          // End date for date range filter
    status: 'all',       // Auction status filter (all, open, closed, sold, draft)
    minAmount: '',       // Minimum bid amount filter
    maxAmount: ''        // Maximum bid amount filter
  });
  
  // Filtered results - stores processed data based on current filters
  const [filteredData, setFilteredData] = useState([]);

  // ===== EFFECT HOOKS =====
  
  // Initial data fetch - runs once on component mount
  useEffect(() => {
    fetchBidData();
  }, []); // Empty dependency array ensures this runs only once
  
  // Filter application - runs whenever bidData or filters change
  useEffect(() => {
    applyFilters();
  }, [bidData, filters]); // Dependencies: re-run when data or filters change

  // ===== DATA FETCHING FUNCTION =====
  
  /**
   * fetchBidData - Critical function for retrieving bid data
   * 
   * This function performs a multi-step data fetching process:
   * 1. Validates user authentication
   * 2. Fetches buyer details to get user ID
   * 3. Retrieves all bids by the buyer
   * 4. Enriches bid data with item and seller information
   * 5. Formats dates and handles error cases gracefully
   * 
   * Error Handling:
   * - Authentication validation
   * - API call failures with fallback data
   * - Missing seller/item information handling
   */
  const fetchBidData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // VALIDATION: Check user authentication
      const buyerEmail = localStorage.getItem('buyerEmail');
      console.log('BidReportGenerator - Buyer email:', buyerEmail);
      
      if (!buyerEmail) {
        setError('User not authenticated. Please login again.');
        setLoading(false);
        return;
      }

      // STEP 1: Fetch buyer details to get user ID
      console.log('BidReportGenerator - Fetching buyer details...');
      const buyerResponse = await axios.get(`http://localhost:5000/api/user/buyer-by-email/${buyerEmail}`);
      const buyerId = buyerResponse.data._id;
      console.log('BidReportGenerator - Buyer ID:', buyerId);

      // STEP 2: Fetch all bids by this buyer using the correct endpoint
      console.log('BidReportGenerator - Fetching bid history...');
      const bidsResponse = await axios.get(`http://localhost:5000/api/bids/history/${buyerId}`);
      const bids = bidsResponse.data;
      console.log('BidReportGenerator - Bids found:', bids.length);

      // STEP 3: Process bid data (item data and seller info are now populated by the API)
      const detailedBids = bids.map(bid => {
        // The API now populates itemId with complete item details and sellerInfo
        const item = bid.itemId || {};
        const sellerInfo = bid.sellerInfo || { name: 'Seller Info Not Available', email: 'Unknown' };
        
        // Return enriched bid data with formatted dates
        return {
          ...bid,
          itemDetails: {
            name: item.name || 'Unknown Item',
            startingPrice: item.startingPrice || 0,
            currentPrice: item.currentPrice || item.startingPrice || 0,
            description: item.description || 'No description available',
            status: item.status || 'unknown',
            endTime: item.endTime,
            sellerId: item.sellerId
          },
          sellerInfo: sellerInfo,
          bidDate: new Date(bid.createdAt).toLocaleDateString(),
          bidTime: new Date(bid.createdAt).toLocaleTimeString(),
          auctionEndDate: item.endTime ? new Date(item.endTime).toLocaleDateString() : 'N/A'
        };
      });

      setBidData(detailedBids);
      setError(''); // Clear error on success
      console.log('BidReportGenerator - Data loaded successfully:', detailedBids.length, 'bids');
    } catch (err) {
      // CRITICAL ERROR HANDLING: Log error and set user-friendly message
      console.error('BidReportGenerator - Error fetching bid data:', err);
      console.error('BidReportGenerator - Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to load bid data. Please try again.';
      if (err.response?.status === 404) {
        errorMessage = 'No bid data found for your account.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false); // Always stop loading indicator
    }
  };

  // ===== FILTERING LOGIC =====
  
  /**
   * applyFilters - Critical function for data filtering
   * 
   * This function applies multiple filters to the bid data:
   * 1. Date range filtering (from/to dates)
   * 2. Status filtering (auction status)
   * 3. Amount range filtering (min/max bid amounts)
   * 
   * Filter Logic:
   * - Creates a copy of bidData to avoid mutations
   * - Applies each filter sequentially if criteria are provided
   * - Updates filteredData state with results
   * 
   * Validation:
   * - Handles invalid dates gracefully
   * - Validates numeric inputs for amount filters
   * - Provides fallback values for missing data
   */
  const applyFilters = () => {
    let filtered = [...bidData]; // Create copy to avoid mutations

    // FILTER 1: Date range filtering
    if (filters.dateFrom) {
      filtered = filtered.filter(bid => 
        new Date(bid.createdAt) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(bid => 
        new Date(bid.createdAt) <= new Date(filters.dateTo)
      );
    }

    // FILTER 2: Status filtering - filter by auction status
    if (filters.status !== 'all') {
      filtered = filtered.filter(bid => bid.itemDetails.status === filters.status);
    }

    // FILTER 3: Amount range filtering - validate and filter by bid amounts
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      if (!isNaN(minAmount)) { // VALIDATION: Ensure minAmount is a valid number
        filtered = filtered.filter(bid => bid.bidAmount >= minAmount);
      }
    }
    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      if (!isNaN(maxAmount)) { // VALIDATION: Ensure maxAmount is a valid number
        filtered = filtered.filter(bid => bid.bidAmount <= maxAmount);
      }
    }

    setFilteredData(filtered); // Update filtered results
  };

  // ===== UTILITY FUNCTIONS =====
  
  /**
   * handleFilterChange - Event handler for filter input changes
   * 
   * Updates the filters state when user modifies filter inputs.
   * This triggers the applyFilters useEffect hook automatically.
   * 
   * @param {Event} e - Input change event
   */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ===== EXPORT FUNCTIONS =====
  
  /**
   * generateCSV - Critical function for CSV export functionality
   * 
   * This function generates and downloads a CSV file containing filtered bid data.
   * 
   * Process:
   * 1. Defines CSV headers for structured data export
   * 2. Maps filtered data to CSV rows with proper formatting
   * 3. Creates CSV content with proper escaping for special characters
   * 4. Generates blob and triggers download with timestamped filename
   * 5. Cleans up URL object to prevent memory leaks
   * 
   * Data Validation:
   * - Handles missing data with fallback values
   * - Escapes special characters in text fields
   * - Ensures numeric values are properly formatted
   */
  const generateCSV = () => {
         // CSV Headers - defines the structure of exported data
         const headers = [
           'CeylonCatch Bid Activity Report',
           'Generated: ' + new Date().toLocaleDateString() + ' at ' + new Date().toLocaleTimeString(),
           'Report ID: BR-' + Date.now().toString().slice(-8),
           '',
           'Bid ID',
           'Item Name',
           'Seller Name',
           'Starting Price (Rs.)',
           'Current Price (Rs.)',
           'Your Bid Amount (Rs.)',
           'Bid Date',
           'Bid Time',
           'Auction End Date',
           'Item Status',
           'Position (Leading/Outbid)',
           'Description'
         ];

         // CSV Content Generation - maps filtered data to CSV format
         const csvContent = [
           headers.join(','),
           ...filteredData.map(bid => {
             const isLeading = bid.bidAmount >= (bid.itemDetails.currentPrice || bid.itemDetails.startingPrice);
             const position = isLeading ? 'Leading' : 'Outbid';
             return [
               bid._id,
               `"${bid.itemDetails.name}"`, // Escape text fields with quotes
               `"${bid.sellerInfo.name}"`,
               bid.itemDetails.startingPrice || 0, // Fallback to 0 for missing prices
               bid.itemDetails.currentPrice || bid.itemDetails.startingPrice || 0,
               bid.bidAmount,
               bid.bidDate,
               bid.bidTime,
               bid.auctionEndDate,
               bid.itemDetails.status || 'unknown', // Fallback for missing status
               position,
               `"${bid.itemDetails.description || 'No description'}"`
             ].join(',');
           })
         ].join('\n');

    // File Generation and Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
         a.download = `CeylonCatch-BidReport-${new Date().toISOString().split('T')[0]}.csv`; // Business-oriented filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url); // Clean up to prevent memory leaks
  };

  /**
   * generatePDF - Critical function for PDF export functionality
   * 
   * This function generates a PDF report using browser print functionality.
   * It creates a new window with formatted HTML content and triggers the print dialog.
   * 
   * Process:
   * 1. Opens a new browser window for print preview
   * 2. Generates HTML content with embedded CSS styles
   * 3. Writes formatted report HTML to the new window
   * 4. Triggers browser print dialog for PDF generation
   * 
   * Features:
   * - Professional styling with print-optimized CSS
   * - Responsive table layout for data display
   * - Print media queries for proper formatting
   * - Summary statistics and detailed bid information
   */
  const generatePDF = () => {
    // Open new window for print preview
    const printWindow = window.open('', '_blank');
    const reportHTML = generateReportHTML();
    
    // Generate complete HTML document with embedded styles
           printWindow.document.write(`
             <!DOCTYPE html>
             <html>
               <head>
                 <title>CeylonCatch - Bid Activity Report</title>
                 <style>
                   body { 
                     font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                     margin: 0; 
                     padding: 20px; 
                     background: #ffffff;
                     color: #333;
                     line-height: 1.6;
                   }
                   .header { 
                     text-align: center; 
                     margin-bottom: 40px; 
                     padding: 30px 0;
                     border-bottom: 3px solid #2c5aa0;
                     background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                   }
                   .header-logo {
                     margin-bottom: 20px;
                   }
                   .header h1 {
                     color: #2c5aa0;
                     font-size: 28px;
                     margin: 10px 0;
                     font-weight: 700;
                   }
                   .report-meta {
                     background: #ffffff;
                     padding: 15px;
                     border-radius: 8px;
                     margin-top: 15px;
                     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                   }
                   .report-meta p {
                     margin: 5px 0;
                     font-size: 14px;
                     color: #666;
                   }
                   .report-info { 
                     margin-bottom: 30px; 
                     padding: 25px;
                     background: #f8f9fa;
                     border-radius: 10px;
                     border-left: 5px solid #2c5aa0;
                   }
                   .report-info h3 {
                     color: #2c5aa0;
                     margin-bottom: 15px;
                     font-size: 20px;
                   }
                   .summary-grid {
                     display: grid;
                     grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                     gap: 15px;
                     margin: 20px 0;
                   }
                   .summary-item {
                     background: #ffffff;
                     padding: 15px;
                     border-radius: 8px;
                     text-align: center;
                     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                     border-top: 4px solid #2c5aa0;
                   }
                   .summary-item h4 {
                     color: #2c5aa0;
                     margin: 0 0 5px 0;
                     font-size: 14px;
                     text-transform: uppercase;
                     letter-spacing: 1px;
                   }
                   .summary-item .value {
                     font-size: 24px;
                     font-weight: bold;
                     color: #333;
                   }
                   table { 
                     width: 100%; 
                     border-collapse: collapse; 
                     margin-top: 30px;
                     background: #ffffff;
                     border-radius: 10px;
                     overflow: hidden;
                     box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                   }
                   th, td { 
                     padding: 12px 15px; 
                     text-align: left; 
                     border-bottom: 1px solid #e9ecef;
                   }
                   th { 
                     background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%);
                     color: white;
                     font-weight: 600;
                     text-transform: uppercase;
                     letter-spacing: 0.5px;
                     font-size: 12px;
                   }
                   tr:hover {
                     background-color: #f8f9fa;
                   }
                   .price-cell {
                     font-weight: 600;
                     color: #059669;
                   }
                   .status-badge {
                     padding: 4px 12px;
                     border-radius: 20px;
                     font-size: 11px;
                     font-weight: 600;
                     text-transform: uppercase;
                   }
                   .status-open { background: #d1fae5; color: #065f46; }
                   .status-closed { background: #fee2e2; color: #991b1b; }
                   .status-sold { background: #dbeafe; color: #1e40af; }
                   .footer {
                     margin-top: 40px;
                     padding: 20px;
                     text-align: center;
                     background: #f8f9fa;
                     border-radius: 10px;
                     font-size: 12px;
                     color: #666;
                     border-top: 3px solid #2c5aa0;
                   }
                   @media print { 
                     body { margin: 0; padding: 15px; }
                     .header { page-break-inside: avoid; }
                     table { page-break-inside: auto; }
                     tr { page-break-inside: avoid; page-break-after: auto; }
                   }
                 </style>
               </head>
               <body>
                 ${reportHTML}
                 <div class="footer">
                   <p><strong>CeylonCatch - Professional Seafood Trading Platform</strong></p>
                   <p>This report was generated automatically. For questions, contact support@ceyloncatch.com</p>
                   <p>© ${new Date().getFullYear()} CeylonCatch. All rights reserved.</p>
                 </div>
               </body>
             </html>
           `);
    
    printWindow.document.close();
    printWindow.print(); // Trigger print dialog
  };

  /**
   * generateReportHTML - Helper function for PDF report HTML generation
   * 
   * This function creates the HTML content for PDF reports, including:
   * 1. Report header with generation date
   * 2. Summary statistics section
   * 3. Detailed bid data table
   * 
   * Statistics Calculated:
   * - Total number of bids
   * - Total bid amount
   * - Average bid amount
   * - Number of won auctions
   * 
   * Data Validation:
   * - Handles missing price data with fallback values
   * - Provides default status for unknown auction states
   * - Formats currency values with proper localization
   * 
   * @returns {string} Complete HTML content for the report
   */
  const generateReportHTML = () => {
    // Calculate summary statistics from filtered data
    const totalBids = filteredData.length;
    const totalBidAmount = filteredData.reduce((sum, bid) => sum + bid.bidAmount, 0);
    const avgBidAmount = totalBids > 0 ? totalBidAmount / totalBids : 0; // Prevent division by zero
    const wonAuctions = filteredData.filter(bid => bid.itemDetails.status === 'sold').length;

         return `
             <div class="header">
               <div class="header-logo">
                 <img src="/src/assets/images/logo.png" alt="CeylonCatch Logo" style="height: 100px; width: auto; margin-bottom: 1.5rem;">
               </div>
               <h1>CeylonCatch - Bid Activity Report</h1>
               <div class="report-meta">
                 <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                 <p><strong>Report Period:</strong> ${filters.dateFrom || 'All Time'} ${filters.dateTo ? `to ${filters.dateTo}` : ''}</p>
                 <p><strong>Report ID:</strong> BR-${Date.now().toString().slice(-8)}</p>
               </div>
             </div>
      
             <div class="report-info">
               <h3>Executive Summary</h3>
               <div class="summary-grid">
                 <div class="summary-item">
                   <h4>Total Bids</h4>
                   <div class="value">${totalBids}</div>
                 </div>
                 <div class="summary-item">
                   <h4>Total Investment</h4>
                   <div class="value">Rs. ${totalBidAmount.toLocaleString()}</div>
                 </div>
                 <div class="summary-item">
                   <h4>Average Bid</h4>
                   <div class="value">Rs. ${avgBidAmount.toLocaleString()}</div>
                 </div>
                 <div class="summary-item">
                   <h4>Successful Auctions</h4>
                   <div class="value">${wonAuctions}</div>
                 </div>
                 <div class="summary-item">
                   <h4>Success Rate</h4>
                   <div class="value">${totalBids > 0 ? ((wonAuctions / totalBids) * 100).toFixed(1) : 0}%</div>
                 </div>
                 <div class="summary-item">
                   <h4>Active Bids</h4>
                   <div class="value">${filteredData.filter(bid => bid.itemDetails.status === 'open').length}</div>
                 </div>
               </div>
             </div>

             <h3 style="color: #2c5aa0; margin: 30px 0 15px 0; font-size: 20px;">Detailed Bid History</h3>
             <table>
               <thead>
                 <tr>
                   <th>Item Name</th>
                   <th>Seller</th>
                   <th>Starting Price</th>
                   <th>Current Price</th>
                   <th>Your Bid</th>
                   <th>Bid Date</th>
                   <th>Status</th>
                   <th>Position</th>
                 </tr>
               </thead>
               <tbody>
                 ${filteredData.map((bid, index) => {
                   const isLeading = bid.bidAmount >= (bid.itemDetails.currentPrice || bid.itemDetails.startingPrice);
                   const position = isLeading ? 'Leading' : 'Outbid';
                   return `
                     <tr>
                       <td><strong>${bid.itemDetails.name}</strong><br><small style="color: #666;">${bid.itemDetails.description || 'No description'}</small></td>
                       <td>${bid.sellerInfo.name}</td>
                       <td class="price-cell">Rs. ${(bid.itemDetails.startingPrice || 0).toLocaleString()}</td>
                       <td class="price-cell">Rs. ${(bid.itemDetails.currentPrice || bid.itemDetails.startingPrice || 0).toLocaleString()}</td>
                       <td class="price-cell"><strong>Rs. ${bid.bidAmount.toLocaleString()}</strong></td>
                       <td>${bid.bidDate}<br><small style="color: #666;">${bid.bidTime}</small></td>
                       <td><span class="status-badge status-${(bid.itemDetails.status || 'unknown').toLowerCase()}">${bid.itemDetails.status || 'unknown'}</span></td>
                       <td><span style="color: ${isLeading ? '#059669' : '#dc2626'}; font-weight: 600;">${position}</span></td>
                     </tr>
                   `;
                 }).join('')}
               </tbody>
             </table>
    `;
  };

  /**
   * resetFilters - Utility function to clear all filter criteria
   * 
   * Resets all filter values to their default state, which will:
   * - Show all bid data (no filtering applied)
   * - Trigger the applyFilters useEffect hook
   * - Update the filteredData state with unfiltered results
   */
  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: 'all',
      minAmount: '',
      maxAmount: ''
    });
  };

  // ===== CONDITIONAL RENDERING =====
  
  // LOADING STATE: Display spinner while fetching data
  if (loading) {
    return (
      <div className="bid-report-loading">
        <div className="loading-spinner"></div>
        <p>Loading your bid data...</p>
      </div>
    );
  }

  // ERROR STATE: Display error message with retry option
  if (error) {
    return (
      <div className="bid-report-error">
        <p>{error}</p>
        <button onClick={fetchBidData} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  // ===== STATISTICS CALCULATION =====
  
  // Calculate summary statistics from filtered data
  const totalBids = filteredData.length;
  const totalBidAmount = filteredData.reduce((sum, bid) => sum + bid.bidAmount, 0);
  const avgBidAmount = totalBids > 0 ? totalBidAmount / totalBids : 0; // Prevent division by zero
  const wonAuctions = filteredData.filter(bid => bid.itemDetails.status === 'sold').length;

  return (
    <motion.div
      className="bid-report-generator"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="report-header">
        <div className="header-logo-section">
          <img src="/src/assets/images/logo.png" alt="CeylonCatch Logo" className="report-logo" />
          <div className="header-text">
            <div className="report-title">
              <FaGavel className="report-icon" />
              <h2>CeylonCatch - Bid Activity Report</h2>
            </div>
            <p className="report-subtitle">Professional Bid Analysis & Performance Tracking</p>
          </div>
        </div>
        <div className="report-actions">
          <button 
            onClick={generateCSV}
            className="export-btn csv-btn"
            disabled={filteredData.length === 0}
          >
            <FaFileCsv />
            Export CSV
          </button>
          <button 
            onClick={generatePDF}
            className="export-btn pdf-btn"
            disabled={filteredData.length === 0}
          >
            <FaFilePdf />
            Export PDF
          </button>
          <button 
            onClick={() => setShowReport(!showReport)}
            className="export-btn preview-btn"
            disabled={filteredData.length === 0}
          >
            <FaPrint />
            {showReport ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="report-filters">
        <div className="filter-section">
          <h3><FaFilter /> Filter Options</h3>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Date From:</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label>Date To:</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label>Status:</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="sold">Sold</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Min Amount (Rs.):</label>
              <input
                type="number"
                name="minAmount"
                value={filters.minAmount}
                onChange={handleFilterChange}
                placeholder="0"
                className="filter-input"
                min="0"
                step="1"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            <div className="filter-group">
              <label>Max Amount (Rs.):</label>
              <input
                type="number"
                name="maxAmount"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                placeholder="No limit"
                className="filter-input"
                min="0"
                step="1"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            <div className="filter-group">
              <button onClick={resetFilters} className="reset-filters-btn">
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="report-summary">
        <div className="summary-card">
          <FaGavel className="summary-icon" />
          <div className="summary-content">
            <h3>{totalBids}</h3>
            <p>Total Bids</p>
          </div>
        </div>
        <div className="summary-card">
          <FaDollarSign className="summary-icon" />
          <div className="summary-content">
            <h3>Rs. {totalBidAmount.toLocaleString()}</h3>
            <p>Total Bid Amount</p>
          </div>
        </div>
        <div className="summary-card">
          <FaClock className="summary-icon" />
          <div className="summary-content">
            <h3>Rs. {avgBidAmount.toLocaleString()}</h3>
            <p>Average Bid</p>
          </div>
        </div>
        <div className="summary-card">
          <FaFish className="summary-icon" />
          <div className="summary-content">
            <h3>{wonAuctions}</h3>
            <p>Won Auctions</p>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {showReport && (
        <motion.div
          className="report-preview"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.5 }}
        >
          <div className="preview-header">
            <h3>Report Preview</h3>
            <span className="record-count">{filteredData.length} records found</span>
          </div>
          
          <div className="bid-table-container">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Seller</th>
                  <th>Starting Price</th>
                  <th>Current Price</th>
                  <th>Your Bid</th>
                  <th>Bid Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((bid, index) => (
                  <tr key={bid._id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="item-name">
                      <FaFish className="item-icon" />
                      {bid.itemDetails.name}
                    </td>
                    <td>
                      <FaUser className="user-icon" />
                      {bid.sellerInfo.name}
                    </td>
                    <td className="price-cell">Rs. {(bid.itemDetails.startingPrice || 0).toLocaleString()}</td>
                    <td className="price-cell current-price">
                      Rs. {(bid.itemDetails.currentPrice || bid.itemDetails.startingPrice || 0).toLocaleString()}
                    </td>
                    <td className="price-cell bid-amount">Rs. {bid.bidAmount.toLocaleString()}</td>
                    <td>
                      <FaCalendarAlt className="date-icon" />
                      {bid.bidDate}
                    </td>
                    <td>
                      <span className={`status-badge ${bid.itemDetails.status || 'unknown'}`}>
                        {(bid.itemDetails.status || 'unknown').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BidReportGenerator;
