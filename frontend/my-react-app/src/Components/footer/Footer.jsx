import React from 'react'
import './footer.css'

const Footer = () => {
  return (
    <div>
        <footer>
  <div class="newsletter">
    <h4>Subscribe Newsletter</h4>
    <h2>Get The Updated News</h2>
    <form>
      <input type="email" placeholder="Email" />
      <button type="submit">Subscribe Now</button>
    </form>
  </div>

  <div class="footer-links">
    <div class="quick-links">
      <h4>Quick Links</h4>
      <ul>
        <li>Home</li>
        <li>About Us</li>
        <li>Destination</li>
        <li>Contact</li>
      </ul>
    </div>

    <div class="other-pages">
      <h4>Other Pages</h4>
      <ul>
        <li>Privacy & Policy</li>
        <li>Terms of Use</li>
        <li>Disclaimer</li>
        <li>FAQ</li>
      </ul>
    </div>

    <div class="contact-info">
      <h4>Contact Info</h4>
      <p>Jl. Raya Mas Ubud No.88, Gianyar, Bali, Indonesia - 80571</p>
      <p>+62 361 154874</p>
      <p>contact@domain.com</p>
    </div>

    <div class="closer">
      <h4>Closer With Us Now!</h4>
      <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.</p>
      <button>+62 361 154874</button>
    </div>
  </div>

   <div class="footer-bottom">
    <div class="logo">
      <span>FIQUA</span>
    </div>
    <p>Fish Farm Template Kit by Jegtheme</p>
    <p>Copyright © 2021. All rights reserved.</p>
  </div>
</footer>

    </div>
  )
}

export default Footer