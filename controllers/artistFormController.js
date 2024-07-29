const ArtistForm = require("../models/artistFormModel");
const catchAsync = require("../Utils/catchAsync");
const APIFeatures = require("../Utils/apiFeatures");
const { sendEmail } = require("../Utils/sendEmail");

exports.createEmail = catchAsync(async (req, res) => {
    const artistForm = await ArtistForm.create(req.body);
    const artistEmail = req.body.email
    res.status(201).json({
        status: "success",
        data: {
            artistForm: artistForm,
        }
    });
    await sendEmail("lirteam25@gmail.com", "LIR - An artist has completed the form",
        `<html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your token has been sold </title>
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet" >
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        
            <style>
        .fab:hover {
                color: rgb(214, 11, 82); /* Change the color on hover */
            }
            body, h1, p, a {
                font-family: 'Space Grotesk', sans-serif;
            }
            </style>
        </head>
        <div style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
                <div style="margin: 50px 0">
        <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">Notification</h1>
        <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">an artist has completed the form</div> 
        </div>
        
              </div>
              </html>`
    );

    await sendEmail(artistEmail, "LIR artists form completed",
        `<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LIR Artist Application</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        <style>
            .fab:hover {
                color: rgb(214, 11, 82); /* Change the color on hover */
            }
            body, h1, p, a {
                font-family: 'Space Grotesk', sans-serif;
            }
        </style>
    </head>
    <body style="color:white; background-color:rgb(17,17,17); font-family:sans-serif; padding: 50px 10%; overflow: auto">
        <div style="margin: 50px 0">
            <h1 style="color:rgb(214, 11, 82); text-align:center; text-transform:uppercase; margin: 0;">Notification</h1>
            <div style="text-align:center; font-size: 18px; font-family: 'Space Grotesk', sans-serif">
                Hey,<br><br>
                Thank you for applying to LIR. Nice to meet you; I'm Filippo.<br><br>
                I would love to have a quick call with you (15 minutes) to explain everything about the project. Do you prefer another channel rather than email for communication?<br><br>
                Thank you for your interest.<br><br>
                Best regards,<br><br>
                Filippo Andretta<br>
                CEO<br><br>
                +39 334 3973277<br>
                <a href="https://lirmusic.com" style="color: rgb(214, 11, 82); text-decoration: none;">lirmusic.com</a> | <a href="mailto:info@lirmusic.com" style="color: rgb(214, 11, 82); text-decoration: none;">info@lirmusic.com</a>
            </div>
        </div>
    </body>
    </html>`
    );
});

exports.getEmail = catchAsync(async (req, res) => {
    const features = new APIFeatures(ArtistForm.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const nfts = await features.query;
    //Send response
    res.status(200).json({
        status: "success",
        result: nfts.length,
        data: {
            users,
        },
    });
})