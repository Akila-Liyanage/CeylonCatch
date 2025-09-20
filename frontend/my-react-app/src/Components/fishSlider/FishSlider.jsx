import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Star, Waves, Fish, Heart, Sparkles } from 'lucide-react';
import Tuna from '../../assets/images/tuna.jpg'
import Salmon from '../../assets/images/salmon.jpg'
import Lobster from '../../assets/images/lobster.jpg'
import Shrimp from '../../assets/images/shrimp.jpg'
import './fishSlider.css';

const FishSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hoveredSlide, setHoveredSlide] = useState(null);
  const [titleAnimated, setTitleAnimated] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const containerRef = useRef(null);

  const fishData = [
    {
      id: 1,
      name: "Premium Tuna",
      description: "Wild-caught bluefin tuna, rich in omega-3 fatty acids. Perfect for sashimi and premium dishes.",
      image: Tuna,
      price: "$34.99",
      originalPrice: "$42.99",
      rating: 4.8,
      tag: "Premium",
      gradient: "linear-gradient(to right, #2563eb, #7c3aed)",
      savings: "Save $8"
    },
    {
      id: 2,
      name: "Atlantic Salmon",
      description: "Fresh Norwegian salmon with vibrant color and buttery texture. Sustainably sourced.",
      image: Salmon,
      price: "$28.99",
      originalPrice: "$35.99",
      rating: 4.9,
      tag: "Best Seller",
      gradient: "linear-gradient(to right, #ec4899, #f97316)",
      savings: "Save $7"
    },
    {
      id: 3,
      name: "Lobster",
      description: "Fresh, wild-caught lobster with tender, succulent meat. Perfect for gourmet dishes and fine dining.",
      image: Lobster,
      price: "$26.99",
      originalPrice: "$32.99",
      rating: 4.7,
      tag: "Fresh Today",
      gradient: "linear-gradient(to right, #ef4444, #db2777)",
      savings: "Save $6"
    },
    {
      id: 4,
      name: "Shrimp",
      description: "Wild-caught shrimp with irresistible flavor and texture. Elevate your meals with a healthy and delicious seafood choice.",
      image: Shrimp,
      price: "$31.99",
      originalPrice: "$38.99",
      rating: 4.6,
      tag: "Chef's Choice",
      gradient: "linear-gradient(to right, #0d9488, #2563eb)",
      savings: "Save $7"
    },
    {
      id: 5,
      name: "King Mackerel",
      description: "Nutrient-rich mackerel with bold flavor and perfect oil content. Great for grilling.",
      image: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&h=800&fit=crop&crop=center",
      price: "$22.99",
      originalPrice: "$28.99",
      rating: 4.5,
      tag: "Value Pick",
      gradient: "linear-gradient(to right, #10b981, #3b82f6)",
      savings: "Save $6"
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % fishData.length);
  }, [fishData.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + fishData.length) % fishData.length);
  }, [fishData.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [nextSlide, isAutoPlaying]);

  useEffect(() => {
    const timer = setTimeout(() => setTitleAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const getSlidePosition = (index) => {
    const diff = index - currentSlide;
    const length = fishData.length;
    const normalizedDiff = ((diff % length) + length) % length;
    
    if (normalizedDiff === 0) return { transform: 'translateX(0px) scale(1.1)', zIndex: 5, opacity: 1 };
    if (normalizedDiff === 1 || normalizedDiff === length - 1) {
      const isNext = normalizedDiff === 1;
      return { 
        transform: `translateX(${isNext ? '280px' : '-280px'}) scale(0.85)`, 
        zIndex: 3, 
        opacity: 0.7 
      };
    }
    if (normalizedDiff === 2 || normalizedDiff === length - 2) {
      const isNext = normalizedDiff === 2;
      return { 
        transform: `translateX(${isNext ? '480px' : '-480px'}) scale(0.7)`, 
        zIndex: 1, 
        opacity: 0.4 
      };
    }
    return { transform: 'translateX(0px) scale(0.5)', zIndex: 0, opacity: 0 };
  };

  const toggleFavorite = (fishId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(fishId)) {
        newFavorites.delete(fishId);
      } else {
        newFavorites.add(fishId);
      }
      return newFavorites;
    });
  };

  return (
    <div ref={containerRef} className="fish-slider-container">
      {/* Floating Bubbles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`bubble-${i}`}
          className="bubble"
          style={{
            width: `${Math.random() * 15 + 8}px`,
            height: `${Math.random() * 15 + 8}px`,
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 5 + 6}s`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}

      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="bg-element" style={{ top: '25%', left: '25%', width: '24rem', height: '24rem', backgroundColor: '#3b82f6' }}></div>
        <div className="bg-element delay-1000" style={{ top: '75%', right: '25%', width: '20rem', height: '20rem', backgroundColor: '#0d9488' }}></div>
        <div className="bg-element delay-2000" style={{ top: '50%', left: '50%', width: '18rem', height: '18rem', backgroundColor: '#7c3aed' }}></div>
        <div className="bg-element delay-3000" style={{ top: '16.666%', right: '16.666%', width: '16rem', height: '16rem', backgroundColor: '#db2777' }}></div>
      </div>

      {/* Enhanced Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="ocean-wave"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <Waves style={{ color: 'rgba(191, 219, 254, 0.2)', width: '1.5rem', height: '1.5rem' }} />
          </div>
        ))}
        {[...Array(6)].map((_, i) => (
          <div
            key={`fish-${i}`}
            className="fish-swim"
            style={{
              right: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            <Fish style={{ color: 'rgba(153, 246, 228, 0.15)', width: '2rem', height: '2rem' }} />
          </div>
        ))}
        {/* Sparkle Effects */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            <Sparkles style={{ color: 'rgba(255, 255, 255, 0.1)', width: '1rem', height: '1rem' }} />
          </div>
        ))}
      </div>

      <div className="container px-4 py-16 h-full flex flex-col justify-center">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="shimmer-effect" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(to right, rgba(13, 148, 136, 0.2), rgba(37, 99, 235, 0.2))', backdropFilter: 'blur(4px)', padding: '0.75rem 2rem', borderRadius: '9999px', border: '1px solid rgba(94, 234, 212, 0.3)', marginBottom: '2rem' }}>
            <Fish style={{ width: '1.5rem', height: '1.5rem', color: '#2dd4bf' }} />
            <span style={{ color: '#5eead4', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.875rem' }}>PREMIUM OCEAN SELECTION</span>
            <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#2dd4bf', borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' }}></div>
          </div>
          
          <h1 className={`enhanced-title ${titleAnimated ? 'animate' : ''}`}>
            Ocean's Finest
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: '#cbd5e1', maxWidth: '48rem', margin: '0 auto', lineHeight: '1.625', fontWeight: 300 }}>
            Experience the freshest catch from pristine waters, delivered with care and passion to your table. 
            <span style={{ display: 'block', marginTop: '0.5rem', color: '#5eead4', fontWeight: 600 }}>Sustainably sourced • Premium quality • Daily fresh</span>
          </p>
        </div>

        {/* Enhanced Slider */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '4rem' }}>
          {/* Enhanced Navigation Buttons */}
          <button
            onClick={prevSlide}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            className="nav-button"
            style={{ left: '1rem' }}
          >
            <ChevronLeft style={{ width: '1.75rem', height: '1.75rem' }} />
          </button>

          <button
            onClick={nextSlide}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
            className="nav-button"
            style={{ right: '1rem' }}
          >
            <ChevronRight style={{ width: '1.75rem', height: '1.75rem' }} />
          </button>

          {/* Enhanced Slides Container */}
          <div className="h-420px" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {fishData.map((fish, index) => {
              const style = getSlidePosition(index);
              const isActive = index === currentSlide;
              const isFavorite = favorites.has(fish.id);
              
              return (
                <div
                  key={fish.id}
                  className={`fish-card ${isActive ? 'card-float' : ''}`}
                  style={style}
                  onMouseEnter={() => {
                    setHoveredSlide(index);
                    setIsAutoPlaying(false);
                  }}
                  onMouseLeave={() => {
                    setHoveredSlide(null);
                    setIsAutoPlaying(true);
                  }}
                  onClick={() => setCurrentSlide(index)}
                >
                  <div className="fish-image">
                    {/* Enhanced Tag */}
                    <div className="fish-tag" style={{ background: fish.gradient }}>
                      {fish.tag}
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(fish.id);
                      }}
                      style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                    >
                      <Heart style={{ 
                        width: '1.25rem', 
                        height: '1.25rem', 
                        transition: 'all 0.3s',
                        color: isFavorite ? '#f87171' : '#fff',
                        fill: isFavorite ? 'currentColor' : 'none'
                      }} />
                    </button>

                    {/* Savings Badge */}
                    <div style={{ position: 'absolute', top: '4rem', left: '1rem', zIndex: 10, padding: '0.25rem 0.75rem', backgroundColor: '#10b981', color: 'white', fontSize: '0.75rem', fontWeight: 700, borderRadius: '9999px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                      {fish.savings}
                    </div>

                    {/* Enhanced Image */}
                    <img
                      src={fish.image}
                      alt={fish.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        transition: 'all 0.7s',
                        transform: isActive ? 'scale(1.1)' : 'scale(1)'
                      }}
                    />

                    {/* Enhanced Overlays */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.3), transparent)' }}></div>
                    
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)',
                      transition: 'opacity 0.3s',
                      opacity: hoveredSlide === index ? 0.95 : 0.8
                    }}></div>

                    {/* Enhanced Content */}
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      padding: '1.5rem',
                      transform: isActive ? 'translateY(0)' : 'translateY(1rem)',
                      transition: 'all 0.5s'
                    }}>
                      {/* Enhanced Rating */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.75rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            style={{ 
                              width: '1.25rem', 
                              height: '1.25rem', 
                              transition: 'all 0.2s',
                              color: i < Math.floor(fish.rating) ? '#fbbf24' : '#9ca3af',
                              fill: i < Math.floor(fish.rating) ? 'currentColor' : 'none'
                            }}
                          />
                        ))}
                        <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', marginLeft: '0.5rem', fontWeight: 600 }}>({fish.rating})</span>
                      </div>

                      <h3 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', marginBottom: '0.75rem' }}>{fish.name}</h3>
                      
                      <p style={{ 
                        color: '#e2e8f0', 
                        fontSize: '0.875rem', 
                        marginBottom: '1.25rem', 
                        lineHeight: '1.625',
                        transition: 'all 0.3s',
                        opacity: isActive && hoveredSlide === index ? 1 : 0.9
                      }}>
                        {fish.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="price-glow" style={{ fontSize: '1.875rem', fontWeight: 900, color: '#2dd4bf' }}>{fish.price}</span>
                          <span style={{ fontSize: '0.875rem', color: '#94a3b8', textDecoration: 'line-through' }}>{fish.originalPrice}</span>
                        </div>

                        <button className={`shimmer-effect ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 2rem', borderRadius: '9999px', fontWeight: 700, transition: 'all 0.3s' }}>
                          <ShoppingCart style={{ width: '1.25rem', height: '1.25rem' }} />
                          Order Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Dots Navigation */}
        <div className="dot-nav">
          {fishData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`nav-dot ${index === currentSlide ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Enhanced Auto-play indicator */}
        <div className="text-center">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.875rem', transition: 'all 0.3s', opacity: isAutoPlaying ? 0.6 : 1 }}>
            <div style={{ 
              width: '0.75rem', 
              height: '0.75rem', 
              borderRadius: '50%', 
              backgroundColor: isAutoPlaying ? '#2dd4bf' : '#64748b',
              animation: isAutoPlaying ? 'pulse 2s ease-in-out infinite' : 'none',
              boxShadow: isAutoPlaying ? '0 0 20px rgba(45, 212, 191, 0.5)' : 'none'
            }}></div>
            {isAutoPlaying ? 'Auto-playing slides...' : 'Paused - Hover cards to explore'}
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {currentSlide + 1} of {fishData.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishSlider;