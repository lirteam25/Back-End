const UserListeningActivity = require("./../models/userListeningActivity");
const catchAsync = require("./../Utils/catchAsync");

exports.createActivity = catchAsync(async (req, res) => {
    const newActivity = await UserListeningActivity.create({ ...req.body, ...req.user });
    res.status(201).json({
        status: "success",
        data: {
            newActivity,
        }
    });
});

exports.createAnonymousActivity = catchAsync(async (req, res) => {
    const newActivity = await UserListeningActivity.create({ ...req.body, "uid": "anonymous" });
    res.status(201).json({
        status: "success",
        data: {
            newActivity,
        }
    });
})
