//in app.js we want to run the function that are always required
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

//We must import the files from user and nft
const authTokenRouter = require("./routes/authTokenRoute")
const tokenInfoRouter = require("./routes/tokenInfoRoute");
const tokenOwnersRouter = require("./routes/tokenOwnerRoute");
const usersRouter = require("./routes/usersRoute");
const tokenTransactionRouter = require("./routes/tokenTransactionRoute");
const artistFormRouter = require("./routes/artistFormRoute");
const userListeningActivityRouter = require("./routes/userListeningActivityRoute");
const snapshotRouter = require("./routes/snapshotRoute");

const globalErrorHandler = require("./controllers/errorController");

const app = express();
//app.use(express.urlencoded({ limit: '50mb' }));

var whitelist = ["http://localhost:3000", "https://front-end-development-f5b8.up.railway.app", "https://lirmusic.com", "https://www.lirmusic.com"]
const corsOptions = {
    origin: whitelist,
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

//Data Sanitazion against NoSQL query injection
app.use(mongoSanitize());

//Data Sanitazion against site script XSS
app.use(xss());

//Prevent parameter pollution
app.use(hpp({
    whitelist: []
}));

//Secure Header http
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false, }));


//massimo numero di richieste in una ora
/* const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many request from this IP, please try again in an hour",
});
app.use(morgan("dev"));

//In every single route I want to apply this limit
app.use("/api", limiter); */

//Serving Template Demo. How to serve data in our browser
//app.use(express.static(`${__dirname}/nft-data/img`));


//Custom Middle Ware. They require 3 parameters. Request, response and next. I want to execute the middleware everytime.
//Every time there is a call there will be this middleware. The order is very important. The middleware works only if before a function.
app.use((req, res, next) => {
    console.log("Hey I am from middleware function");
    next();
})

app.use(morgan("dev"));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    //console.log(req.headers);
    next();
})

const admin = require('firebase-admin');

// import service account file (helps to know the firebase project details)
const { privateKey } = JSON.parse(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

const serviceAccount = {
    "type": process.env.FIREBASE_ADMIN_TYPE,
    "project_id": process.env.FIREBASE_ADMIN_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
    "private_key": privateKey,
    "client_email": process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_ADMIN_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_ADMIN_AUTH_URI,
    "token_uri": process.env.FIREBASE_ADMIN_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL
}

// Intialize the firebase-admin project/account
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use("/api/v1/authToken", authTokenRouter)
app.use("/api/v1/nfts", tokenInfoRouter);
app.use("/api/v1/owners", tokenOwnersRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/transactions", tokenTransactionRouter);
app.use("/api/v1/artistForm", artistFormRouter);
app.use("/api/v1/userListeningActivity", userListeningActivityRouter);
app.use("/api/v1/report", snapshotRouter);

//middleware for error handling. All: triggers for all the erorrs. 
//If it is a user or nft request it will go in the user or nft route. Otherwise it will go in this.
/* app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
}); */

//Global error handling
app.use(globalErrorHandler);

module.exports = app;