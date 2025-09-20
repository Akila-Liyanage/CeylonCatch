import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './util/DB.js';
import cors from 'cors';
import  itemRoutes from './routes/item.routes.js';
import bidRoutes from './routes/bid.routes.js';
import orderRoutes from './routes/order.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import financeRoutes from './routes/finance.routes.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

// Connect DB
connectDB();

const app = express();

//Allow all origins
app.use(cors());


app.use(express.json());

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





io.on("connection", (socket) => {
  console.log("A user connected: ", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  })
})

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
