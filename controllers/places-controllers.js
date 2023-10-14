const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const Place = require("../models/place");
const User = require("../models/user");
const fs = require('fs');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError("Something went wrong could not find the place", 500)
    );
  }
  if (!place) {
    const err = new HttpError(
      "could not find the place please check the entered id",
      500
    );
    return next(err);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesbyUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithplaces;
  try {
    userWithplaces = await User.findById(userId).populate("places");
  } catch (error) {
    const err = new HttpError(
      "Couldnot find places for the provided user id",
      500
    );
    return next(err);
  }

  if (!userWithplaces || userWithplaces.length === 0) {
    return next(new HttpError("Could not find user, invalid user id", 404));
  }
  res.json({
    places: userWithplaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createNewPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("invalid inputs passed, please check your data", 422)
    );
  }
  const { title, description, address } = req.body;

  const createdPlace = await new Place({
    title,
    description,
    address,
    image: req.file.path,
    creator : req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    return next(
      new HttpError("Something went wrong creating place failed", 500)
    );
  }

  if (!user) {
    return next(new HttpError("Could not find user for the provided id", 404));
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    const err = new HttpError("Creating place failed try again", 500);
    return next(err);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, rext) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;
  let updatedPlace;

  try {
    updatedPlace = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError(
      "couldnot find the place to be updated , please check the id entered and try again",
      500
    );
    return next(err);
  }

  if(updatedPlace.creator.toString() !== req.userData.userId){
    const err = new HttpError(
      "You are not allowed to update this Place",
      401
    );
    return next(err);
  }

  updatedPlace.title = title;
  updatedPlace.description = description;

  try {
    await updatedPlace.save();
  } catch (error) {
    const err = new HttpError(
      "Something went wrong could not update place.",
      500
    );
    return next(err);
  }

  res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  if(place.creator.id !== req.userData.userId){
    const err = new HttpError(
      "You are not allowed to delete this Place",
      401
    );
    return next(err);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath,err=>{
    console.log(err);
  })

  res.status(200).json({ message: "Deleted place." });
};

exports.deletePlaceById = deletePlaceById;
exports.updatePlaceById = updatePlaceById;
exports.createNewPlace = createNewPlace;
exports.getPlaceById = getPlaceById;
exports.getPlacesbyUserId = getPlacesbyUserId;
