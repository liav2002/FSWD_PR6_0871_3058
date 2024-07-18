# README

## Prerequisites

1. **MySQL Server**
   - Ensure you have MySQL Server installed on your local machine. You can download and install MySQL from the official website: [MySQL Downloads](https://dev.mysql.com/downloads/mysql/).

2. **Node.js**
   - Ensure you have Node.js installed on your machine. You can download and install Node.js from the official website: [Node.js Downloads](https://nodejs.org/).

## Setup Instructions

### Step 1: Create a Local MySQL Server

1. Open MySQL Workbench or any other MySQL client.
2. Create a new database named `ChatterBoxDB` by executing the following SQL command:

   ```sql
   CREATE DATABASE ChatterBoxDB;

### Step 2: Configure `config.json`

1. Navigate to the root directory of your project where the config.json file is located.
2. Open the config.json file and update it with your MySQL server credentials. It should look something like this:

    ```json
    {
        "host": "localhost",
        "user": "your_mysql_username",
        "password": "your_mysql_password",
        "database": "ChatterBoxDB"
    }

### Step 3: Install Dependencies
1. Open a terminal or command prompt.
2. Navigate to the chatterbox-db-scripts directory:

    ```sh
    cd path\to\your\project\chatterbox-db-scripts
3. Install the required dependencies by running:

    ```sh
    npm install mysql2

### Step 4: Run the Script
1. Ensure you are still in the `chatterbox-db-scripts` directory.
2. Run the `create_database.js` script using Node.js:

    ```sh
    node create_database.js
3. You should see messages indicating the successful creation and insertion of data into the database tables. The final message should be:

    ```sh
    Database setup complete. All data inserted successfully.

This `README.md` file provides detailed instructions and explanations for setting up and running the `create_database.js` script, including prerequisites, setup steps, and troubleshooting tips, all tailored for Windows users.