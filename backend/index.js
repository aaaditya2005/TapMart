const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');

//Routes
const userRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api/auth', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});