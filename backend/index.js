const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');
const userRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api/auth', userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});