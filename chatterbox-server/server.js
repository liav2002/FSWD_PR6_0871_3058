const fs = require('fs');
const mysql = require('mysql2');
const path = require('path');
const express = require('express');
const app = express();
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

const configFilePath = path.join(__dirname, '..', 'config.json');
const configData = fs.readFileSync(configFilePath, 'utf-8');
const dbConfig = JSON.parse(configData);

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
      console.error('Database connection error:', err);
    } else {
      console.log('Successfully connected to the database!');
    }
  });

const usersRouter = require('./js/users')(connection);
const messagesRouter = require('./js/messages')(connection);
const groupsRouter = require('./js/groups')(connection);
const reportedMsgRouter = require('./js/reported_msg')(connection);

app.use('/users', usersRouter);
app.use('/messages', messagesRouter);
app.use('/groups', groupsRouter);
app.use('/reports', reportedMsgRouter);

const port = 5002;
app.listen(port, () => {
console.log(`Server running on port ${port}`);
});