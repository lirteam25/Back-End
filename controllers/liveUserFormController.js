const liveUserForm = require("../models/liveUserFormModel");
const catchAsync = require("../Utils/catchAsync");
const APIFeatures = require("../Utils/apiFeatures");

exports.saveEmail = catchAsync(async (req, res) => {
    const liveUser = await liveUserForm.create(req.body);
    const liveUserEmail = req.body.email
    res.status(201).json({
        status: "success",
        data: {
            liveUser: liveUser,
        }
    });
})

exports.getEmail = catchAsync(async (req, res) => {
    const features = new APIFeatures(liveUserForm.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const liveUsers = await features.query;
    //Send response
    res.status(200).json({
        status: "success",
        result: liveUsers.length,
        data: {
            users,
        },
    });
})