const Snapshot = require("../models/snapshotModel");
const catchAsync = require("../Utils/catchAsync");
const APIFeatures = require("../Utils/apiFeatures");

exports.getReport = catchAsync(async (req, res) => {
    const features = new APIFeatures(Snapshot.find(), req.query)
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