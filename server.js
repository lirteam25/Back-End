//All the database connection are here. 
//We run the server.js file and not the app one
const app = require("./app");
const mongoose = require("mongoose");
const cron = require('node-cron');
const { updateTopCollectors } = require('./tasks/updateTopCollectors');
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD)

mongoose.connect(DB).then(() => {
    console.log("DataBase connection succefully");
})

// Cron job setup
cron.schedule('0 * * * *', async () => {
    console.log('Running top collectors update job...');
    try {
        await updateTopCollectors();
        console.log('Top collectors update completed successfully.');
    } catch (error) {
        console.error('Error updating top collectors:', error);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});