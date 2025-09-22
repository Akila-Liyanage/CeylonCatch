import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './util/DB.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import  itemRoutes from './routes/item.routes.js';
import bidRoutes from './routes/bid.routes.js';
import orderRoutes from './routes/order.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import financeRoutes from './routes/finance.routes.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import payhereRoutes from './routes/payhere.routes.js';

dotenv.config();

// Connect DB
connectDB();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

//Allow all origins
app.use(cors());


app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create HTTP server & attach socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",  // change to frontend URL in production
    methods: ["GET", "POST"]
  }
});

//Middleware to inject io into requests
app.use((req, res, next) => {
  req.io = io;
  next();
})

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payhere', payhereRoutes);





io.on("connection", (socket) => {
  console.log("A user connected: ", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  })
})

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
