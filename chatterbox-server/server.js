const mysql = require('mysql2');

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

  