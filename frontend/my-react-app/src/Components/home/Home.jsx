import React, { useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
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
import { Link } from 'react-router';
import { ParallaxProvider, ParallaxBanner, Parallax } from 'react-scroll-parallax';
import { FloatingWhatsApp } from 'react-floating-whatsapp';
import Footer from '../footer/Footer';
import FishSlider from '../fishSlider/FishSlider';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const headingVariants = {
  hidden: { opacity: 0, y: -30, rotate: -1, skewY: 2 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    skewY: 0,
    transition: { 
      type: 'spring', 
      stiffness: 120, 
      damping: 15,
      duration: 0.8
    }
  }
};

const paraVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' }
  }
};

const buttonsContainer = {
  hidden: {},
  visible: { 
    transition: { 
      staggerChildren: 0.1, 
      delayChildren: 0.4 
    } 
  }
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      type: 'spring', 
      stiffness: 160, 
      damping: 14,
      duration: 0.6
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 80, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      type: 'spring', 
      stiffness: 45, 
      damping: 15, 
      duration: 0.8 
    }
  }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: 'easeOut' }
  }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: 'easeOut' }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' }
  }
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const Home = () => {
  const fishCount = useMotionValue(0);
  const storeCount = useMotionValue(0);
  const customerCount = useMotionValue(0);
  const deliveryCount = useMotionValue(0);

  const roundedFishCount = useTransform(() => Math.round(fishCount.get()));
  const roundedStoreCount = useTransform(() => Math.round(storeCount.get()));
  const roundedCustomerCount = useTransform(() => Math.round(customerCount.get()));
  const roundedDeliveryCount = useTransform(() => Math.round(deliveryCount.get()));

  // Refs for sections
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);
  
  const isSection1InView = useInView(section1Ref, { once: true, margin: "-100px" });
  const isSection2InView = useInView(section2Ref, { once: true, margin: "-100px" });
  const isSection3InView = useInView(section3Ref, { once: true, margin: "-100px" });
  const isSection4InView = useInView(section4Ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isSection1InView) {
      const fishControls = animate(fishCount, 1200, { duration: 2.5, ease: "easeOut" });
      const storeControls = animate(storeCount, 120, { duration: 2.5, ease: "easeOut" });
      const customerControls = animate(customerCount, 3500, { duration: 2.5, ease: "easeOut" });
      const deliveryControls = animate(deliveryCount, 9800, { duration: 2.5, ease: "easeOut" });
      
      return () => {
        fishControls.stop();
        storeControls.stop();
        customerControls.stop();
        deliveryControls.stop();
      };
    }
  }, [isSection1InView]);

  return (
    <ParallaxProvider>
      <div className="homeContainer">
        {/* Floating WhatsApp Button */}
        <FloatingWhatsApp
          phoneNumber="+94705693282"
          accountName="Ceylon Catch"
          avatar={Fish}
          statusMessage="Typically replies within 1 hour"
          chatMessage="Hello there! How can we help you today?"
          placeholder="Type a message..."
          allowClickAway
          notification
          notificationDelay={60000} // 1 minute
          className="whatsapp-float"
        />
        
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
                Experience the finest selection of sustainably sourced seafood, delivered directly 
                from our trusted fishermen to your table. Our real-time bidding system ensures you 
                get the freshest catch at competitive prices.
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
                whileHover={{ 
                  y: -6, 
                  scale: 1.03, 
                  boxShadow: '0 22px 48px rgba(0,194,201,0.32)' 
                }}
                whileTap={{ scale: 0.98, y: -2 }}
                aria-label="Learn more"
              >
                Explore Our Products
              </motion.button>

              <motion.button
                className="ContactUs"
                variants={buttonVariants}
                whileHover={{
                  y: -6,
                  scale: 1.02,
                  background: 'rgba(15,23,42,0.98)',
                  color: '#ffffff',
                  borderColor: 'transparent',
                  boxShadow: '0 18px 38px rgba(15,23,42,0.25)'
                }}
                whileTap={{ scale: 0.98, y: -2 }}
                aria-label="Contact us"
              >
                Contact Us
              </motion.button>
            </motion.div>
          </motion.div>
          
          {/* Animated scroll indicator */}
          <motion.div 
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span>Scroll Down</span>
            <div className="scroll-arrow"></div>
          </motion.div>
        </div>
        
        {/* Feature Cards Section */}
        <motion.div 
          className="homeCenter"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
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

        {/* Stats Section */}
        <section className="section1" ref={section1Ref}>
          <motion.div 
            className="section1Top"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="section1Topleft">
              <h2>Welcome To Ceylon Catch</h2>
              <motion.button 
                className='learnMore'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </div>
            <div className="section1Top1right">
              <p>CeylonCatch is a modern fish market management platform that connects fishermen, buyers, and businesses in one place. Our system offers real-time bidding for fresh catches, streamlined finance management, supermarket ordering, inventory tracking, and user management.</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="section1Bottom"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={fadeInLeft}>
              <img src={FishLot} alt="Fish market" />
            </motion.div>
            
            <motion.div className="section1Card" variants={scaleUp} whileHover={{ y: -10 }}>
              <div className="sectioncard1Top">
                <SetMealIcon style={{width:"50px", height:"50px"}}/>
              </div>
              <motion.span className="sectioncard1Center">{roundedFishCount}</motion.span>
              <span className="sectioncard1Bottom">Fish Lots per Month</span>
            </motion.div>
            
            <motion.div className="section1Card" variants={scaleUp} whileHover={{ y: -10 }}>
              <div className="sectioncard1Top">
                <StoreIcon style={{width:"50px", height:"50px"}}/>
              </div>
              <motion.span className="sectioncard1Center">{roundedStoreCount}</motion.span>
              <span className="sectioncard1Bottom">Outlet Store</span>
            </motion.div>
            
            <motion.div className="section1Card" variants={scaleUp} whileHover={{ y: -10 }}>
              <div className="sectioncard1Top">
                <SetMealIcon style={{width:"50px", height:"50px"}}/>
              </div>
              <motion.span className="sectioncard1Center">{roundedCustomerCount}</motion.span>
              <span className="sectioncard1Bottom">Happy Customers</span>
            </motion.div>
            
            <motion.div className="section1Card" variants={scaleUp} whileHover={{ y: -10 }}>
              <div className="sectioncard1Top">
                <StoreIcon style={{width:"50px", height:"50px"}}/>
              </div>
              <motion.span className="sectioncard1Center">{roundedDeliveryCount}</motion.span>
              <span className="sectioncard1Bottom">Deliveries Made</span>
            </motion.div>
          </motion.div>
        </section>

        <FishSlider/>

        {/* About Us Section */}
        <section className="section2" ref={section2Ref}>
          <div className="section2Container">
            <motion.div
              variants={fadeInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <video
                src="./video/video1.mp4"
                autoPlay
                loop
                muted
                style={{ width: '350px', height: '350px', objectFit: 'cover', borderRadius: '12px' }}
                playsInline
              />
            </motion.div>
            
            <motion.div 
              className="aboutUs"
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
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
                <motion.button 
                  className='learnMore'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  About US
                </motion.button>
              </div>
            </motion.div>
            
            <motion.div
              variants={fadeInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <video
                src="./video/video2.mp4"
                autoPlay
                loop
                muted
                style={{ width: '350px', height: '350px', objectFit: 'cover', borderRadius: '12px' }}
                playsInline
              />
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section3" ref={section3Ref}>
          <motion.span
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            Contact Us
          </motion.span>
          <motion.h1
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            BECOME OUR CUSTOMER & GET SPECIAL OFFER EVERYDAY
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            Join us today and enjoy exclusive daily deals on the freshest seafood, delivered straight to you
          </motion.p>
          <motion.button 
            className="ContactUs"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contact Us
          </motion.button>
        </section>

        {/* Products Section */}
        <section className="section4" ref={section4Ref}>
          <div className="section4Top">
            <motion.span
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              Our Products
            </motion.span>
            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
            >
              THE PRODUCT THAT WE PROVIDE <br /> FOR YOU IS HIGH QUALITY
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              Carefully sourced and delivered fresh, our seafood guarantees the finest taste and premium quality every time
            </motion.p>
          </div>
          <motion.div 
            className="section4Bottom"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={cardVariants}>
              <Product
                category='Fish'
                image={Fish}
                title='Fresh Fish'
                desc='Premium quality fresh fish delivered daily from sustainable sources'
                shopLink='/items/replace_with_item_id'
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <Product
                category='Weed'
                image={SeaWeed}
                title='Sea Weed'
                desc='Nutrient-rich seaweed harvested sustainably for health and flavor'
                shopLink='/items/replace_with_item_id'
              />
            </motion.div>
            <motion.div variants={cardVariants}>
              <Product
                category='Oil'
                image={FishOil}
                title='Fish Oil'
                desc='Pure, high-quality fish oil rich in omega-3 fatty acids for optimal health'
                shopLink='/items/replace_with_item_id'
              />
            </motion.div>
          </motion.div>
        </section>
        <Footer/>
      </div>
    </ParallaxProvider>
  );
};

export default Home;