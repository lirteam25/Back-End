//All the database connection are here. 
//We run the server.js file and not the app one
const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const DB = process.env.NODE_ENV === "production"
    ? process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD)
    : process.env.DATABASE_DEV.replace("<PASSWORD>", process.env.DATABASE_DEV_PASSWORD);

mongoose.connect(DB).then(() => {
    console.log("DataBase connection succefully");
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});