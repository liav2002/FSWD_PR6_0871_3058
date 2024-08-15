const mysql = require('mysql2');
const express = require('express');
const app = express();
app.use(express.json());

// Database connection configuration
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "LiavFSWDev02@",
    database: "ChatterBoxDB"
});

// Establish database connection
connection.connect((err) => {
    if (err) {
      console.error('Database connection error:', err);
    } else {
      console.log('Successfully connected to the database!');
    }
  });

// Import routers
const usersRouter = require('./js/users')(connection);

// Set routes
app.use('/users', usersRouter);

// Start the server on the desired port
const port = 5002;
app.listen(port, () => {
console.log(`Server running on port ${port}`);
});