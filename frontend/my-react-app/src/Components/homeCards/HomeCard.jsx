import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from "react-router";

import './homecard.css';

const HomeCard = ({ 
  title = 'Certified Farm', 
  description = 'Fresh, sustainably-sourced fish from certified farms — quality you can trust delivered to your door.',
  ribbon = 'Trusted',
  Icon = CardMembershipIcon // allow injecting a different icon component
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const idSafe = title.replace(/\s+/g, '-').toLowerCase();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }, [isOpen]);

  return (
    <>
      <motion.article
        layoutId={`card-${idSafe}`}
        className="card"
        tabIndex={0}
        aria-label={`${title} card`}
        onClick={() => setIsOpen(true)}
        onMouseMove={(e) => {
          const target = e.currentTarget;
          const rect = target.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          target.style.setProperty('--mx', `${x}px`);
          target.style.setProperty('--my', `${y}px`);
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget;
          target.style.removeProperty('--mx');
          target.style.removeProperty('--my');
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') setIsOpen(true); }}
        role="button"
      >
        <div className="cardTop">
          <motion.div className="iconWrap" layoutId={`icon-${idSafe}`} aria-hidden="true">
            <Icon className="cardIcon" />
          </motion.div>
          <div className="ribbon">{ribbon}</div>
        </div>

        <div className="cardCenter">
          <motion.h2 layoutId={`title-${idSafe}`}>{title}</motion.h2>
          <p>{description}</p>
        </div>

        <div className="cardBottom">
          <a className="readMore" href="#" onClick={(e)=>e.preventDefault()}>
            Read More
            <ArrowForwardIcon className="arrowIcon" />
          </a>
        </div>
      </motion.article>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* overlay */}
            <motion.div
              className="cardModalOverlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              className="cardModal"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div className="modalInner" layoutId={`card-${idSafe}`}>
                <motion.div className="modalTop">
                  <motion.div className="iconWrap modalIcon" layoutId={`icon-${idSafe}`}>
                    <Icon className="cardIcon" />
                  </motion.div>

                  <motion.h2 className="modalTitle" layoutId={`title-${idSafe}`}>{title}</motion.h2>

                  <button
                    className="modalCloseBtn"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                  >
                    <CloseIcon />
                  </button>
                </motion.div>

                <div className="modalBody">
                  <p className="modalDescription">{description}</p>

                  <div className="modalExtras">
                    <p>• Fresh daily catch from trusted suppliers</p>
                    <p>• Sustainably sourced & quality-checked</p>
                    <p>• Fast delivery across local markets</p>
                  </div>

                  <div className="modalActions">
                    <Link to="/items" className="learnMore" onClick={() => setIsOpen(false)}>Bid Now</Link>
                    <button className="ContactUs" onClick={() => setIsOpen(false)}>Order Now</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HomeCard;