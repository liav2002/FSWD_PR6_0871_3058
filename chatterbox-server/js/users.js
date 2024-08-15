const https = require('https');
const mysql = require('mysql2');
const express = require('express');
const router = express.Router();

module.exports = (connection) => {

    // Login
    router.get('/loginUser', (req, res) => {
        console.log("DEBUG: router '/loginUser' handler.");

        const phone = req.query.phone;
        const password = req.query.password;
        
        console.log("DEBUG: request information:");
        console.log("DEBUG: phone <- " + phone);
        console.log("DEBUG: password <- " + password);
        
        // SQL query to retrieve the user's information with the corresponding phone and password
        connection.query('SELECT * FROM users WHERE phone = ? AND password = ?', [phone, password], (err, rows) => {
            if (err) {
                console.error('ERROR: Failed executing the query:', err);
                res.status(500).send('Failed retrieving user information');
            } 
            
            else {
                if (rows.length === 0) {
                    res.status(404).send('User not found');
                } 
                
                else {
                    const user = rows[0]; // First result row
                    const userInfo = {
                        id: user.id,
                        name: user.name,
                        phone: user.phone,
                        email: user.email,
                        profile: user.profil,
                        status: user.status,
                        password: user.password
                    };
                    res.json(userInfo);
                }
            }
        });
    });

    // Register
    router.post('registerUser', (req, res) => {
        console.log("DEBUG: router '/registerUser' handler.");

        const user = req.body; // Retrieve user data from the request

        console.log("DEBUG: request body:");
        console.log("DEBUG: user detalis:");
        console.log(user);

        // Check if the phone number is already in use
        connection.query('SELECT * FROM users WHERE phone = ?', [user.phone], (err, rows) => {
            if (err) {
              console.error('Error while executing the query: ', err);
              res.status(500).send('ERROR: Failed checking phone');
            } 
            
            else {
              if (rows.length > 0) {
                console.log("DEBUG: rows", rows);
                res.status(400).send('Phone number is already in use');
              } 
              
              else {
                // Insert the user into the database
                connection.query('INSERT INTO users (name, phone, email, profil, status, password) VALUES (?, ?, ?, ?, ?, ?)',
                  [user.name, user.phone, user.email, user.profilePictureOption, user.status, user.password],
                  (err, result) => {
                    if (err) {
                      console.error('ERROR: Failed while inserting user into the database: ', err);
                      res.status(500).send('Failed inserting user into the database');
                    } else {
                      const userToAdd = {
                        id: result.insertId,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        profil: user.profilePictureOption,
                        status: user.status,
                        password: user.password
                      };
                      res.json(userToAdd);
                    }
                  }
                );
              }
            }
          });
    });

    // User Information
    router.get('/UserInfo', (req, res) => {
        console.log("DEBUG: router '/UserInfo' handler.");

        const userId = req.query.UserId;
        console.log("DEBUG: user_id <- " + userId);
        
        // Create an SQL query with a prepared parameter
        const query = 'SELECT * FROM users WHERE id = ?';
      
        // Execute the SQL query with the parameter
        connection.query(query, [userId], (err, results) => {
          if (err) {
            console.error('ERROR: Failed in request execution', err);
            res.status(500);
            return res.send({ error: 'An error occurred while retrieving user details.' });
          }
      
          // If the query executed successfully without any errors
          const user = results[0]; 
          console.log("DEBUG: user information:");
          console.log(user);
          res.json(user); // Send the new user as a response
        });
    });
    
    return router;
};