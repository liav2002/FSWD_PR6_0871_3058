const fs = require('fs');
const mysql = require('mysql2');
const path = require('path');
const express = require('express');
const app = express();
app.use(express.json());

// Read the database configuration from config.json
const configFilePath = path.join(__dirname, '..', 'config.json');
const configData = fs.readFileSync(configFilePath, 'utf-8');
const dbConfig = JSON.parse(configData);

// Database connection configuration
const connection = mysql.createConnection(dbConfig);

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
const messagesRouter = require('./js/messages')(connection);
const groupsRouter = require('./js/groups')(connection);
const reportedMsgRouter = require('./js/reported_msg')(connection);

// Set routes
app.use('/users', usersRouter);
app.use('/messages', messagesRouter);
app.use('/groups', groupsRouter);
app.use('/reports', reportedMsgRouter);

// Start the server on the desired port
const port = 5002;
app.listen(port, () => {
console.log(`Server running on port ${port}`);
});