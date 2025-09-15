import React, { useRef } from 'react';
import {animate, delay, motion, useInView, useMotionValue, useTransform} from 'framer-motion';
import './home.css';
import Nav from '../nav/Nav';
import HomeCard from '../homeCards/HomeCard';
import SetMealIcon from '@mui/icons-material/SetMeal';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import FishLot from '../../assets/images/fish_lot.jpg';
import Fish from '../../assets/images/fish.jpg';
import SeaWeed from '../../assets/images/seaweed.jpg';
import FishOil from '../../assets/images/fishoil.jpg';
import StoreIcon from '@mui/icons-material/Store';
import { useEffect } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import Product from '../products/Product';


const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.06
    }
  }
};

const headingVariants = {
  hidden: { opacity: 0, y: -18, rotate: -1, skewY: 2 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    skewY: 0,
    transition: { type: 'spring', stiffness: 130, damping: 18 }
  }
};

const paraVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const buttonsContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.28 } }
};

const buttonVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 180, damping: 16 }
  }
};

const cardVariants = {
  hidden:{ opacity:0, y:60 },
  visible:{
    opacity:1,
    y:0,
    transition:{ type: 'spring', stiffness: 50, damping: 18, delay:0.3 }
  }
};

const headingLeftVariants = {
  hidden: { opacity: 0, x: -80, rotate: -1, skewY: 2 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    skewY: 0,
    transition: { type: 'spring', stiffness: 50, damping: 18, delay:0.3 }
  }
};

const buttonRightVariants = {
  hidden: { opacity: 0, x: 80, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 50, damping: 16, delay:0.3 }
  }
};

const Home = () => {

  const fishCount = useMotionValue(0);
  const storeCount = useMotionValue(0);

  const roundedFishCount = useTransform(() => Math.round(fishCount.get()));
  const roundedStoreCount = useTransform(() => Math.round(storeCount.get()));

  //ref for section
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });


  useEffect(() => {
    
    if (isInView){
      const fishControls = animate(fishCount, 1200, { duration: 3, ease: "easeInOut" });
      const storeControls = animate(storeCount, 120, { duration: 3, ease: "easeInOut" });
      return () => {
      fishControls.stop()
      storeControls.stop()
    };
    }
  },[isInView]);

  return (
    <div className="homeContainer">
      <div className="homeTop">
        <Nav />

        <motion.div
          className="homeTopBody"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="top" variants={headingVariants}>
            <motion.h1
              style={{ display: 'inline-block' }}
              variants={headingVariants}
              aria-label="hero heading"
            >
              FRESH FISH DELIVERED FOR YOU
            </motion.h1>

            <motion.p variants={paraVariants} style={{ marginTop: 18 }}>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Sed vitae consectetur
              obcaecati blanditiis dolorum provident, error natus minus ipsa expedita nemo tempora
              architecto optio? Vitae voluptatem quasi, rem odio velit doloribus sequi iusto
              distinctio maxime. Tempore accusantium, repudiandae
            </motion.p>
          </motion.div>

          <motion.div
            className="bottom"
            variants={buttonsContainer}
            initial="hidden"
            animate="visible"
            aria-hidden={false}
          >
            <motion.button
              className="learnMore"
              variants={buttonVariants}
              whileHover={{ y: -6, scale: 1.03, boxShadow: '0 22px 48px rgba(0,0,0,0.22)' }}
              whileTap={{ scale: 0.98, y: -2 }}
              aria-label="Learn more"
            >
              Learn More
            </motion.button>

            <motion.button
              className="ContactUs"
              variants={buttonVariants}
              whileHover={{
                y: -6,
                scale: 1.02,
                background: 'rgba(255,255,255,0.98)',
                color: 'var(--bg-deep)',
                boxShadow: '0 18px 38px rgba(0,0,0,0.16)'
              }}
              whileTap={{ scale: 0.98, y: -2 }}
              aria-label="Contact us"
            >
              Contact Us
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
      <motion.div 
      className="homeCenter"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{once:true, amount:0.3}}
      >
        <motion.div variants={cardVariants}>
          <HomeCard
        title='Real Time Bidding'
        description='Experience the thrill of real-time bidding on fresh catches, ensuring you get the best quality seafood at competitive prices.'
        Icon={CurrencyExchangeIcon}
        />
        </motion.div>

        <motion.div variants={cardVariants}>
          <HomeCard
        title='Organic Seafood'
        description='Wild-caught seafood from the pristine waters of Sri Lanka, delivered fresh to your doorstep.'
        Icon={SetMealIcon}
        />
        </motion.div>
        
        <motion.div variants={cardVariants}>
          <HomeCard
        title='Sustainable Fishing'
        description='Committed to sustainable fishing practices that protect our oceans and ensure a healthy future for generations to come.'
        Icon={AllInclusiveIcon}
        />
        </motion.div>
      </motion.div>

      <section className="section1" ref={sectionRef}>
        <div className="section1Top">
          <div className="section1Topleft">
            <h2>Welcome To Ceylon Catch</h2>
            <button className='learnMore'>Learn More</button>
          </div>
          <div className="section1Top1right">
            <p>CeylonCatch is a modern fish market management platform that connects fishermen, buyers, and businesses in one place. Our system offers real-time bidding for fresh catches, streamlined finance management, supermarket ordering, inventory tracking, and user management. Designed for efficiency and transparency, it helps both small vendors and large food cities manage seafood trade with ease.</p>
          </div>
        </div>
        <div className="section1Bottom">
          <img src={FishLot} />
          <div className="section1Card">
            <div className="sectioncard1Top">
              <SetMealIcon style={{width:"50px", height:"50px"}}/>
            </div>
            <motion.span className="sectioncard1Center">{roundedFishCount}</motion.span>
            <span className="sectioncard1Bottom">Fish Lots per Month</span>
          </div>
          <div className="section1Card">
            <div className="sectioncard1Top">
              <StoreIcon style={{width:"50px", height:"50px"}}/>
            </div>
            <motion.span className="sectioncard1Center">{roundedStoreCount}</motion.span>
            <span className="sectioncard1Bottom">Outlet Store</span>
          </div>
        </div>
      </section>
      <section className="section2">
        <div className="section2Container">
              <video
              src="./video/video1.mp4"
              autoPlay
              loop
              muted
              style={{ width: '350px', height: '350px', objectFit: 'cover' }}
              playsInline
              />
              <div className="aboutUs">
                <div className="aboutUSTop">
                  <span>About Us</span>
                <h3>We Produced The BEST QUALITY SEAFOODS</h3>
                </div>
                <div className="aboutUSCenter">
                  <div className="aboutUSList">
                    <ul>
                      <li><CheckIcon style={{color:"#00c2c9"}}/> High Quality</li>
                      <li><CheckIcon style={{color:"#00c2c9"}}/> Fresh & Clean</li>
                      <li><CheckIcon style={{color:"#00c2c9"}}/> Quality Certified</li>
                    </ul>
                    <ul>
                      <li><CheckIcon style={{color:"#00c2c9"}}/> Ocean Fresh Always</li>
                      <li><CheckIcon style={{color:"#00c2c9"}}/> From Sea to Plate</li>
                      <li><CheckIcon style={{color:"#00c2c9"}}/> Trusted Seafood, Every Time</li>
                    </ul>
                  </div>
                </div>
                <div className="aboutUSBottom">
                  <button className='learnMore'>About US</button>
                </div>
              </div>
              <video
              src="./video/video2.mp4"
              autoPlay
              loop
              muted
              style={{ width: '350px', height: '350px', objectFit: 'cover' }}
              playsInline
              />
        </div>
      </section>
      <section className="section3">
        <span>Contact Us</span>
        <motion.h1
          variants={headingLeftVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{once:true, amount:0.3}}
        >
          BECOME OUR CUSTOMER & GET SPECIAL OFFER EVERYDAY
          </motion.h1>
        <p>Join us today and enjoy exclusive daily deals on the freshest seafood, delivered straight to you</p>
        <motion.button 
        className="ContactUs"
        variants={buttonRightVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{once:true, amount:0.3}}
        >Contact Us</motion.button>
      </section>
      <section className="section4">
        <div className="section4Top">
          <span>Our Products</span>
          <motion.h1
          variants={headingLeftVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{once:true, amount:0.5}}
          >THE PRODUCT THAT WE PROVIDE <br /> FOR YOU IS HIGH QUALITY</motion.h1>
          <p>Carefully sourced and delivered fresh, our seafood guarantees the finest taste and premium quality every time</p>
        </div>
        <div className="section4Bottom">
          <Product
          category='Fish'
          image={Fish}
          title='Fresh Fish'
          desc='Premium quality fresh fish delivered daily from sustainable sources'
          shopLink='#'
          />
          <Product
          category='Weed'
          image={SeaWeed}
          title='Sea Weed'
          desc='Nutrient-rich seaweed harvested sustainably for health and flavor'
          shopLink='#'
          />
          <Product
          category='Oil'
          image={FishOil}
          title='Fish Oil'
          desc='Pure, high-quality fish oil rich in omega-3 fatty acids for optimal health'
          shopLink='#'
          />
        </div>
      </section>
    </div>
  );
};

export default Home;