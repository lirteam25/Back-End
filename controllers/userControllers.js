const User = require("./../models/userModel");
const Owner = require("./../models/tokenOwnerModel");
const catchAsync = require("./../Utils/catchAsync");
const AppError = require("./../Utils/appError");
const APIFeatures = require("../Utils/apiFeatures");
const admin = require('firebase-admin');


exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 400))
    }
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    })
});

exports.updateMe = catchAsync(async (req, res, next) => {
    const user = await User.findOne(req.user);
    if (!user) {
        return next(new AppError("No User found", 400))
    }
    /* if (req.body.wallet == "undefined") {
        await User.findOneAndUpdate(req.user, {
            $unset: {
                "wallet": ""
            }
        }, {
            runValidators: true,
        }); */
    await User.findOneAndUpdate(req.user, req.body, {
        //remove the previous data and create the new one
        new: true,
        runValidators: true,
    });
    const userUpdated = await User.findOne(req.user);
    //Send response
    res.status(200).json({
        status: "success",
        data: {
            userUpdated,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    const user = await User.findOneAndDelete(req.user);
    if (!user) {
        return next(new AppError("No User found with that email", 400))
    }
    res.status(204).json({
        status: "success",
        data: null,
    });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(User.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const user = await features.query;
    //Send response
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    });
});

exports.getSingleUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new AppError("No User found with that ID", 404))
    }
    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    })
});

exports.createUser = catchAsync(async (req, res) => {
    if (req.body.uid) {
        const existingUser = await User.findOne({ uid: req.body.uid });
        if (existingUser) {
            return next(new AppError("User already exists", 400))
        }
    }

    const user = await User.create({ ...req.user, ...req.body });

    res.status(201).json({
        status: "success",
        data: {
            user: user,
        }
    });
});

exports.createUserGoogleLogin = catchAsync(async (req, res) => {
    if (req.body.uid) {
        const existingUser = await User.findOne({ uid: req.body.uid });
        if (existingUser) {
            return next(new AppError("User already exists", 400))
        }
    }
    const newUser = await User.create({ ...req.user, ...req.body });
    res.status(201).json({
        status: "success",
        data: {
            user: newUser,
        }
    });
});

exports.fetchArtistName = catchAsync(async (req, res) => {
    const cnt = req.query.cnt;
    const artist = await User.findOne({ "artist_minting_contract": cnt });
    res.status(200).json({
        status: "success",
        data: {
            artist_name: artist.artist_name,
            artist_photo: artist.artist_photo,
            artist_description: artist.artist_description,
            artist_instagram: artist.artist_instagram,
            artist_spotify: artist.artist_spotify,
            artist_soundcloud: artist.artist_soundcloud,
            wallet: artist.uid
        }
    })
});

exports.getTopCollectors = catchAsync(async (req, res) => {
    const excludedOwners = ["0x63dd604e72eb0ec35312e1109c29202072ab9cab"];

    const top10Owners = await Owner.aggregate([
        {
            $group: {
                _id: '$owner_of', // Group by the owner_of field
                count: { $sum: 1 }, // Count occurrences of each owner_of
            },
        },
        {
            $match: {
                _id: { $nin: excludedOwners } // Exclude specific owner_of values
            }
        },
        {
            $sort: { count: -1 } // Sort by count in descending order
        },
        {
            $limit: 10 // Limit to the top 10 collectors
        },
        {
            $lookup: {
                from: 'users', // The name of the User collection
                localField: '_id', // Field from the Owner collection
                foreignField: 'uid', // Field from the User collection (changed to wallet)
                as: 'userDetails' // Alias for the joined user details
            }
        },
        {
            $unwind: '$userDetails' // Unwind the array created by the lookup
        },
        {
            $project: {
                _id: 0, // Exclude the default _id field
                owner_of: '$_id', // Rename _id as owner_of
                uid: '$userDetails.uid', // Include the uid field from User
                count: 1 // Include the count field
            }
        }
    ]);


    const uids = top10Owners.map(owner => owner.uid);

    const displayNames = {};
    await Promise.all(
        uids.map(async uid => {
            try {
                const userRecord = await User.find({ uid })
                displayNames[uid] = userRecord.displayName || 'No display name'; // Setting displayName or default message
            } catch (error) {
                console.error('Error fetching user:', error);
                displayNames[uid] = 'No display name'; // Set a default message in case of an error
            }
        })
    );

    // Combining displayNames with top10Owners
    const enrichedTop10Owners = top10Owners.map(owner => ({
        owner_of: owner.owner_of,
        uid: owner.uid,
        count: owner.count,
        displayName: displayNames[owner.uid]
    }));

    res.status(200).json({
        status: "success",
        topCollectors: enrichedTop10Owners
    });
})


exports.getSupporters = catchAsync(async (req, res) => {
    const excludedOwners = ["0x63dd604e72eb0ec35312e1109c29202072ab9cab"];
    const Seller = await Owner.findById(req.params.id);

    const collectors = await Owner.aggregate([
        {
            $match: {
                _id: { $nin: excludedOwners },
                'token_id': Seller.token_id,
                'token_address': Seller.token_address
            }
        },
        {
            $group: {
                _id: '$owner_of',
                count: { $sum: '$amount' }, // Use 'count' as the field name
            },
        },
        {
            $sort: { count: -1 } // Sort by count in descending order
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: 'uid',
                as: 'userDetails'
            }
        },
        {
            $unwind: '$userDetails'
        },
        {
            $project: {
                _id: 0,
                owner_of: '$_id',
                uid: '$userDetails.uid',
                count: 1,
                picture: '$userDetails.picture'
            }
        }
    ]);

    console.log(collectors);


    const uids = collectors.map(owner => owner.uid);

    const displayNames = {};
    await Promise.all(
        uids.map(async uid => {
            try {
                const userRecord = await User.find({ uid })
                displayNames[uid] = userRecord.displayName || 'No display name'; // Setting displayName or default message
            } catch (error) {
                console.error('Error fetching user:', error);
                displayNames[uid] = 'No display name'; // Set a default message in case of an error
            }
        })
    );

    // Combining displayNames with top10Owners
    const enrichedTop10Owners = collectors.map(owner => ({
        owner_of: owner.owner_of,
        uid: owner.uid,
        count: owner.count,
        displayName: displayNames[owner.uid],
        picture: owner.picture,
    }));

    res.status(200).json({
        status: "success",
        supporters: enrichedTop10Owners
    });
})