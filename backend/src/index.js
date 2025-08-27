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
import { bidSocketHandler } from './socket/bid.socket.js';

dotenv.config();

// Connect DB
connectDB();

const app = express();

//Allow all origins
app.use(cors());


app.use(express.json());

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

// Create HTTP server & attach socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",  // change to frontend URL in production
    methods: ["GET", "POST"]
  }
});

// Socket handler
io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);
  bidSocketHandler(io, socket);
  
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
