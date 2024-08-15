const https = require('https');
const mysql = require('mysql2');
const express = require('express');
const router = express.Router();

module.exports = (connection) => {

    // Login
    router.get('/loginUser', (req, res) => {
        console.log("SERVER-DEBUG: router '/loginUser' handler.");

        const phone = req.query.phone;
        const password = req.query.password;
        
        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: phone <- " + phone);
        console.log("SERVER-DEBUG: password <- " + password);
        
        // SQL query to retrieve the user's information with the corresponding phone and password
        connection.query('SELECT * FROM users WHERE phone = ? AND password = ?', [phone, password], (err, rows) => {
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
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
        console.log("SERVER-DEBUG: router '/registerUser' handler.");

        const user = req.body; // Retrieve user data from the request

        console.log("SERVER-DEBUG: request body:");
        console.log("SERVER-DEBUG: user detalis:");
        console.log(user);

        // Check if the phone number is already in use
        connection.query('SELECT * FROM users WHERE phone = ?', [user.phone], (err, rows) => {
            if (err) {
              console.error('Error while executing the query: ', err);
              res.status(500).send('SERVER-ERROR: Failed checking phone');
            } 
            
            else {
              if (rows.length > 0) {
                console.log("SERVER-DEBUG: rows", rows);
                res.status(400).send('Phone number is already in use');
              } 
              
              else {
                // Insert the user into the database
                connection.query('INSERT INTO users (name, phone, email, profil, status, password) VALUES (?, ?, ?, ?, ?, ?)',
                  [user.name, user.phone, user.email, user.profilePictureOption, user.status, user.password],
                  (err, result) => {
                    if (err) {
                      console.error('SERVER-ERROR: Failed while inserting user into the database: ', err);
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
        console.log("SERVER-DEBUG: router '/UserInfo' handler.");

        const userId = req.query.UserId;
        console.log("SERVER-DEBUG: user_id <- " + userId);
        
        // Create an SQL query with a prepared parameter
        const query = 'SELECT * FROM users WHERE id = ?';
      
        // Execute the SQL query with the parameter
        connection.query(query, [userId], (err, results) => {
          if (err) {
            console.error('SERVER-ERROR: Failed in request execution', err);
            res.status(500);
            return res.send({ error: 'An error occurred while retrieving user details.' });
          }
      
          // If the query executed successfully without any errors
          const user = results[0]; 
          console.log("SERVER-DEBUG: user information:");
          console.log(user);
          res.json(user); // Send the new user as a response
        });
    });

    // Update User Information
    router.put('/updateUserInfo', (req, res) => {
        console.log("SERVER-DEBUG: router '/updateUserInfo' handler.");

        const userId = req.query.id; 
        const userName = req.query.name;
        const userStatus = req.query.status;
        const userPassword = req.query.password;
        const userEmail = req.query.email;
        const userProfile = req.query.profil;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: user_id <- " + userId);
        console.log("SERVER-DEBUG: user_name <- " + userName);
        console.log("SERVER-DEBUG: user_status <- " + userStatus);
        console.log("SERVER-DEBUG: user_password <- " + userPassword);
        console.log("SERVER-DEBUG: user_email <- " + userEmail);
        console.log("SERVER-DEBUG: user_profile <- " + userProfile);
      
        const query = `UPDATE users SET name = ?, email = ?, profil = ?, status = ?, password = ? WHERE id = ?`;
      
        // Execute the SQL query with the parameters
        connection.query(query, [userName, userEmail, userProfile, userStatus, userPassword, userId], (error, results) => {
          if (error) {
            console.error('SERVER-ERROR: Failed in request execution', error);
            res.status(500);
            return res.send({ error: 'An error occurred while updating the user profile.' });
          }
      
          // Check if the update query affected any rows in the database
          if (results.affectedRows === 0) {
            return res.send({ error: 'User not found' });
          }
      
          res.status(200);
          res.json(userId);
        });
    });

    // Information about chat group participants
    router.get('/ParticipantsInfo', (req, res) => {
        console.log("SERVER-DEBUG: router '/ParticipantsInfo' handler.");

        const groupId = req.query.GroupId;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: group_id <- " + usergroupIdId);
      
        const query = 'SELECT participantsId FROM chat_groups WHERE id = ?';
      
        // Execute the SQL query with the parameter
        connection.query(query, [groupId], (err, results) => {
          if (err) {
            console.error('SERVER-ERROR: Failed in request execution', err);
            res.status(500);
            return res.send({ error: 'An error occurred while retrieving participants information.' });
          }
      
          const group = results[0];
          const participantsIdArray = JSON.parse(group.participantsId);
          const participantsIdIntegers = participantsIdArray.map(id => parseInt(id));
      
          console.log("SERVER-DEBUG: participantsId as integers:");
          console.log(participantsIdIntegers);
          res.json({ participantsId: participantsIdIntegers });
        });
    });

    // Route GET to retrieve all users except the currently logged-in user
    router.get('/AllUsers', (req, res) => {
        console.log("SERVER-DEBUG: router '/AllUsers' handler.");

        const loggedInUsername = req.query.loggedInUsername;

        console.log("SERVER-DEBUG: request information:");
        console.log("SERVER-DEBUG: Logged-In-Username <- " + loggedInUsername);

        connection.query('SELECT * FROM users WHERE name != ?', [loggedInUsername], (err, rows) => {
            if (err) {
                console.error('SERVER-ERROR: Failed executing the query:', err);
                res.status(500).send('Error retrieving users');
            } 
            
            else {
                res.json(rows);
            }
        });
    });
    
    return router;
};