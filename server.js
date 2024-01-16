//All the database connection are here. 
//We run the server.js file and not the app one
const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
    console.log("DataBase connection succefully");
})
//Environmental variable. We want to define our own environment variable.
//console.log(app.get("env"));
//console.log(process.env);

/* const testNFT = new NFT({
    name: "The Woman",
    price: 4,
    rating: 3
})
//Save the document in the database
testNFT.save().then(docNFT => {
    console.log(docNFT)
}).catch((error) => {
    console.log("ERROR:", error);
}); */

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});