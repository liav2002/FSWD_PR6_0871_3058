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
                console.error('Error executing the query:', err);
                res.status(500).send('Error retrieving user information');
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

        
    });
    
    return router;
};