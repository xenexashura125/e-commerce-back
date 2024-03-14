const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
require('dotenv').config();
require('./config/passport')

// const authRoute = require('./routes/auth')
const authRoute = require('./routes/auth')
const cartsRoute = require('./routes/carts')
const ordersRoute = require('./routes/orders')
const itemsView = require('./routes/views')
const port = process.env.PORT || 7777;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize())
app.use(passport.session())

app.use(cors({
    origin:'http://localhost:3000',
    methods:'GET,POST,PUT,DELETE',
    credentials:true
}));
app.use(bodyParser.json());

const uri = process.env.MONGO_URI;

mongoose
  .connect(uri, {

  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });

app.use('/auth', authRoute)
app.use('/carts',cartsRoute);
app.use('/orders',ordersRoute);
app.use('/views',itemsView);
// Define your routes and other app logic here

app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});
