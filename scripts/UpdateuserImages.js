const { MongoClient } = require('mongodb');

const string = "mongodb+srv://Pelepo:<PASSWORD>@cluster0.23iasfb.mongodb.net/?retryWrites=true&w=majority";
const password = "XPpqUd2DQDp5c5g";
const uri = string.replace("<PASSWORD>", password);
const client = new MongoClient(uri);

console.log("Hi");

async function runScript() {
    try {
        await client.connect();
        console.log('Connected to the client.');

        const database = client.db('test');
        const collection = database.collection('users');

        console.log('Connected to the database.');

        // Update all documents in the collection

        const AllUsersCursor = await collection.find({ role: { $in: ["user", "artist", "admin"] } });
        const AllUsersArray = await AllUsersCursor.toArray();
        console.log(AllUsersArray);
        for (const element of AllUsersArray) {
            const randomPictureNumber = Math.floor(Math.random() * 7) + 1;
            await collection.updateOne({ "_id": element._id }, { $set: { "picture": randomPictureNumber } });
            console.log(`Updated user ${element._id} with picture: ${randomPictureNumber}`);
        }

        console.log('Picture parameter added to all users.');
    } catch (err) {
        console.error('Error connecting to the database or updating users:', err);
    } finally {
        // Close the connection
        await client.close();
        console.log('Connection closed.');
    }
}

runScript();
