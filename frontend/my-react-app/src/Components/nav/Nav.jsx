import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import logo from '../../assets/images/logo.png';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from "framer-motion";
import '../home/home.css';
import './nav.css';

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const navLinks = ["Home", "About Us", "Service", "Pages", "Contact Us"];
  const pagesLinks = ["Blog", "Blog Details", "Portfolio", "Contact"];
  const suggestions = [
    "Fresh Tuna",
    "Salmon Fillet",
    "Prawns",
    "Crabs",
    "Sardines",
    "Fish Market Near Me",
    "Same-day Delivery",
    "Frozen Fish Packs"
  ];

  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsSearchOpen(false);
      }
    };
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // init auth user
    try { const stored = JSON.parse(localStorage.getItem('authUser') || 'null'); setAuthUser(stored); } catch {}
    const onStorage = (e) => { if (e.key === 'authUser') { try { setAuthUser(JSON.parse(e.newValue)); } catch { setAuthUser(null); } } };
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // autofocus input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setHighlight(-1);
    } else {
      setQuery('');
      setHighlight(-1);
    }
  }, [isSearchOpen]);

  const filtered = query.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions.slice(0, 6);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && filtered[highlight]) {
        setQuery(filtered[highlight]);
        setIsSearchOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const menuVariants = {
    hidden: { opacity: 0, y: -12, transition: { duration: 0.22 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.18 } }
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('authUser');
    setAuthUser(null);
    navigate('/');
  };

  const location = useLocation();

  return (
    <div className={`navBar${scrolled ? ' scrolled' : ''}`}>
      <div className="navLeft">
        <Link to="/" aria-label="Go to Home">
          <img src={logo} alt="Ceylon Catch" />
        </Link>
      </div>

      <div className="navCenter">
        {navLinks.map((link, index) => {
          if (link === "Pages") {
            return (
              <div
                key={link}
                className={`dropdown${isOpen ? ' active' : ''}`}
                ref={dropdownRef}
                onMouseEnter={() => { setIsOpen(true); setActiveIndex(index); }}
                onMouseLeave={() => setIsOpen(false)}
              >
                <a
                  href="#"
                  className={activeIndex === index ? 'active pages-btn' : 'pages-btn'}
                  aria-expanded={isOpen}
                  onClick={(e) => { e.preventDefault(); setIsOpen(v => !v); setActiveIndex(index); }}
                >
                  {link}
                  <KeyboardArrowDownIcon fontSize="small" className="dropdown-icon" />
                </a>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="dropdown-menu"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={menuVariants}
                    >
                      {pagesLinks.map((p, pi) => (
                        <a
                          key={pi}
                          href="#"
                          className="dropdown-item"
                          onClick={(e) => { e.preventDefault(); setActiveIndex(index); setIsOpen(false); }}
                        >
                          {p}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={link}
              to={link === 'Home' ? '/' : '#'}
              className={location.pathname === '/' && link === 'Home' ? 'active' : ''}
              onClick={() => setActiveIndex(index)}
            >
              {link}
            </Link>
          );
        })}
      </div>

      <div className="navRight" ref={searchRef}>
        <div className="searchIcon">
          <SearchIcon
            onClick={() => setIsSearchOpen(s => !s)}
            style={{ cursor: 'pointer' }}
            aria-label="Open search"
          />

          <AnimatePresence>
            {isSearchOpen && (
              <>
                {/* overlay to dim rest of page */}
                <motion.div
                  className="search-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSearchOpen(false)}
                />

                <motion.div
                  className="search-panel"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="search-row">
                    <input
                      ref={inputRef}
                      className="searchInput"
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setHighlight(-1); }}
                      onKeyDown={onKeyDown}
                      placeholder="Search fish, products or help..."
                      aria-label="Search"
                    />
                    <button
                      className="searchCloseBtn"
                      onClick={() => setIsSearchOpen(false)}
                      aria-label="Close search"
                    >
                      <CloseIcon fontSize="small" />
                    </button>
                  </div>

                  <motion.ul
                    className="search-suggestions"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    {filtered.length === 0 && (
                      <li className="suggestion empty">No results</li>
                    )}
                    {filtered.map((s, i) => (
                      <li
                        key={s}
                        className={`suggestion ${i === highlight ? 'active' : ''}`}
                        onMouseEnter={() => setHighlight(i)}
                        onMouseLeave={() => setHighlight(-1)}
                        onClick={() => { setQuery(s); setIsSearchOpen(false); }}
                      >
                        {s}
                      </li>
                    ))}
                  </motion.ul>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {authUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 600 }}>Hi, {authUser.name}</span>
            <button onClick={handleLogout} className="logoutBtn">Logout</button>
          </div>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Nav;