# CeylonCatch 🐟

A comprehensive fish and seafood marketplace platform that connects buyers and sellers through an auction-based bidding system. CeylonCatch provides a complete solution for managing fish lots, inventory, orders, and financial operations.

## 🌟 Features

### For Buyers
- Browse and search fish lots
- Participate in real-time bidding auctions
- View bid history and track orders
- Secure payment processing via PayHere
- User dashboard with order management

### For Sellers
- Create and manage fish lots
- Upload fish lot images
- Monitor bids in real-time
- Manage inventory
- Track sales and orders
- Seller dashboard with analytics

### For Administrators
- Complete admin dashboard
- User management (Buyers, Sellers, Employees)
- Financial management:
  - Payroll system
  - Employee attendance tracking
  - Invoice generation
  - Transaction reports
  - Market entry management
- Order management and oversight
- Bid report generation
- Payment history analytics

### Core Features
- **Real-time Bidding**: Live auction system with Socket.io
- **Authentication**: Secure JWT-based authentication with OTP verification (Twilio)
- **Payment Integration**: PayHere payment gateway
- **File Upload**: Image upload for fish lots using Multer
- **PDF Generation**: Automated report and invoice generation
- **Responsive Design**: Modern UI with Tailwind CSS and Material-UI
- **OCR Support**: Text extraction from images using Tesseract.js

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (Mongoose ODM)
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Twilio** - OTP service
- **Joi** - Input validation
- **jsPDF** - PDF generation

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Material-UI** - Component library
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **Tesseract.js** - OCR functionality

## 📁 Project Structure

```
CeylonCatch/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Business logic
│   │   │   ├── admin.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── bid.controller.js
│   │   │   ├── finance.controller/  # Finance modules
│   │   │   ├── inventory.controller.js
│   │   │   ├── item.controller.js
│   │   │   ├── order.controller.js
│   │   │   └── user.controller.js
│   │   ├── models/             # Database models
│   │   │   ├── Bid.model.js
│   │   │   ├── finance.model/
│   │   │   ├── Inventory.model.js
│   │   │   ├── Item.model.js
│   │   │   ├── Order.model.js
│   │   │   └── User models
│   │   ├── routes/             # API routes
│   │   ├── util/               # Utilities
│   │   │   └── DB.js           # Database connection
│   │   └── index.js            # Server entry point
│   ├── uploads/                # Uploaded files
│   └── package.json
│
└── frontend/
    └── my-react-app/
        ├── src/
        │   ├── Components/      # React components
        │   │   ├── admin/       # Admin components
        │   │   ├── Bid/         # Bidding components
        │   │   ├── dashBoards/  # Dashboard components
        │   │   ├── inventory/   # Inventory management
        │   │   ├── login/       # Authentication
        │   │   └── ...
        │   ├── assets/         # Static assets
        │   ├── services/        # API services
        │   └── App.jsx          # Main app component
        └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn
- Twilio account (for OTP)
- PayHere account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/CeylonCatch.git
   cd CeylonCatch
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend/my-react-app
   npm install
   ```

4. **Environment Variables**

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ceyloncatch
   JWT_SECRET=your_jwt_secret_key
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   PAYHERE_MERCHANT_ID=your_payhere_merchant_id
   PAYHERE_SECRET=your_payhere_secret
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   # Default: mongodb://localhost:27017
   ```

6. **Run the Application**

   **Backend:**
   ```bash
   cd backend
   npm run dev    # Development mode with nodemon
   # or
   npm start      # Production mode
   ```

   **Frontend:**
   ```bash
   cd frontend/my-react-app
   npm run dev    # Development server
   # or
   npm run build  # Production build
   npm run preview # Preview production build
   ```

   The backend will run on `http://localhost:5000`
   The frontend will run on `http://localhost:5173` (Vite default)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification

### Items & Bidding
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get item details
- `POST /api/items` - Create new item (Seller)
- `POST /api/bids` - Place a bid
- `GET /api/bids/:itemId` - Get bids for an item

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Inventory
- `GET /api/inventory` - Get inventory
- `POST /api/inventory` - Add inventory item
- `PUT /api/inventory/:id` - Update inventory item

### Finance (Admin)
- `GET /api/finance/employees` - Get employees
- `POST /api/finance/employees` - Add employee
- `GET /api/finance/attendance` - Get attendance records
- `POST /api/finance/attendance` - Mark attendance
- `GET /api/finance/payroll` - Get payroll data
- `GET /api/finance/reports` - Generate reports

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## 🎨 Key Features Implementation

### Real-time Bidding
- Uses Socket.io for real-time bid updates
- Automatic bid validation and conflict resolution
- Live bid notifications to all connected users

### File Upload
- Multer middleware for handling multipart/form-data
- Image storage in `backend/uploads` directory
- Automatic file naming and organization

### Payment Processing
- PayHere integration for secure payments
- Payment callback handling
- Transaction recording

### OTP Verification
- Twilio SMS integration
- Secure OTP generation and validation
- Time-based expiration

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Input validation with Joi
- CORS configuration
- Helmet.js for security headers
- Environment variable protection

## 📱 Responsive Design

The frontend is fully responsive and works on:
- Desktop
- Tablet
- Mobile devices

## 🧪 Development

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name - [Your GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Express.js community
- React team
- MongoDB
- All open-source contributors

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

**Note**: Make sure to configure all environment variables before running the application. The application requires MongoDB to be running and proper API keys for Twilio and PayHere services.

