import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { FaShoppingCart, FaUser, FaBars, FaTimes, FaSearch } from 'react-icons/fa';
import logo from '../../assets/images/logo.png';
import './nav.css';

const Nav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Check if user is logged in
    const checkLoginStatus = () => {
      const buyerToken = localStorage.getItem('buyerToken');
      const sellerToken = localStorage.getItem('sellerToken');
      const buyerEmail = localStorage.getItem('buyerEmail');
      const sellerEmail = localStorage.getItem('sellerEmail');
      
      if (buyerToken && buyerEmail) {
        setIsLoggedIn(true);
        setUserType('buyer');
        setUserEmail(buyerEmail);
      } else if (sellerToken && sellerEmail) {
        setIsLoggedIn(true);
        setUserType('seller');
        setUserEmail(sellerEmail);
      } else {
        setIsLoggedIn(false);
        setUserType('');
        setUserEmail('');
      }
    };

    checkLoginStatus();
    
    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    // Listen for custom login events
    const handleLoginEvent = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogin', handleLoginEvent);
    window.addEventListener('userLogout', handleLoginEvent);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleLoginEvent);
      window.removeEventListener('userLogout', handleLoginEvent);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Handle search functionality here
    console.log('Search query:', searchQuery);
  };

  const handleLogout = () => {
    localStorage.removeItem('buyerToken');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('buyerEmail');
    localStorage.removeItem('sellerEmail');
    setIsLoggedIn(false);
    setUserType('');
    setUserEmail('');
    setIsMobileMenuOpen(false);
    
    // Dispatch custom logout event
    window.dispatchEvent(new CustomEvent('userLogout'));
  };


  return (
    <>
      <nav className={`navBar ${isScrolled ? 'scrolled' : ''}`}>
        {/* Left - Logo */}
        <div className="navLeft">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <img 
              src={logo} 
              alt="Ceylon Catch Logo" 
              className="logo"
            />
            
          </Link>
        </div>

        {/* Center - Navigation Links */}
        <div className="navCenter">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/auctions" className="nav-link">Auctions</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>

        {/* Right - Search, Cart, Auth */}
        <div className="navRight">
          {/* Search Icon */}
          <div className="searchIcon">
            <button 
              className="search-toggle"
              onClick={toggleSearch}
              aria-label="Search"
            >
              <FaSearch />
            </button>
          </div>

          {/* Cart Icon */}
          <Link to="/cart" className="flex items-center space-x-1 text-gray-600 hover:text-cyan-500 transition-colors">
            <FaShoppingCart className="text-lg" />
            <span className="hidden sm:inline">Cart</span>
          </Link>

              {/* User/Auth Links */}
              <div className="flex items-center space-x-2">
                {isLoggedIn ? (
                  <>
                    <span className="welcome-message">
                      👋 Welcome, {userEmail.split('@')[0]}
                    </span>
                    <Link 
                      to={userType === 'buyer' ? '/bdashboard' : '/sdashboard'}
                      className="dashboard-btn"
                    >
                      📊 Dashboard
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="logout-btn"
                    >
                      🚪 Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/buyerlogin" 
                      className="px-4 py-2 text-gray-600 hover:text-cyan-500 transition-colors font-medium"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/buyerregister" 
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 font-medium"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn lg:hidden"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </nav>

      {/* Search Panel */}
      {isSearchOpen && (
        <>
          <div className="search-overlay active" onClick={toggleSearch}></div>
          <div className="search-panel active">
            <form onSubmit={handleSearchSubmit} className="search-row">
              <input
                type="text"
                className="searchInput"
                placeholder="Search for fish, auctions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="button" className="searchCloseBtn" onClick={toggleSearch}>
                <FaTimes />
              </button>
            </form>
            <div className="search-suggestions">
              <div className="suggestion">Fresh Tuna</div>
              <div className="suggestion">Salmon Auction</div>
              <div className="suggestion">Lobster</div>
              <div className="suggestion">Shrimp</div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        {/* Mobile Logo */}
        <div className="mobile-logo-section" style={{textAlign: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{display: 'inline-flex', alignItems: 'center', gap: '0.75rem'}}>
            <img 
              src={logo} 
              alt="Ceylon Catch Logo" 
              className="logo"
              style={{height: '50px', width: 'auto'}}
            />
            <span style={{color: 'white', fontSize: '1.25rem', fontWeight: 'bold'}}>Ceylon Catch</span>
          </Link>
        </div>
        
        <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
        <Link to="/products" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
        <Link to="/auctions" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Auctions</Link>
        <Link to="/about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
        <Link to="/contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
        
        <div className="mt-4 pt-4 border-t border-gray-600">
          <Link to="/cart" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            <FaShoppingCart className="inline mr-2" />
            Cart
          </Link>
          {isLoggedIn ? (
            <>
              <div className="welcome-message" style={{margin: '8px 0', textAlign: 'center'}}>
                👋 Welcome, {userEmail.split('@')[0]}
              </div>
              <Link 
                to={userType === 'buyer' ? '/bdashboard' : '/sdashboard'} 
                className="dashboard-btn" 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{margin: '8px 0', textAlign: 'center', display: 'block'}}
              >
                📊 Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="logout-btn"
                style={{margin: '8px 0', width: '100%'}}
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/buyerlogin" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                <FaUser className="inline mr-2" />
                Login
              </Link>
              <Link to="/buyerregister" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Nav;
