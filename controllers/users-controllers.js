const HttpError = require("../models/http-error");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    return next(
      (err = new HttpError(
        "something went wrong, not able to fetch users",
        500
      ))
    );
  }
  if (!users) {
    return next(new HttpError("No users found", 404));
  }

  res.json({ users: users.map((users) => users.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("invalid inputs passed, please check your data", 422)
    );
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("Signing up failed please try again later", 500);
    return next(err);
  }

  if (existingUser) {
    const err = new HttpError("The provided Email Address already exist", 422);
    return next(err);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    const err = new HttpError(
      "something went wrong while generating password, please try again later",
      500
    );
    return next(err);
  }

  const newUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
  });

  try {
    await newUser.save();
  } catch (error) {
    const err = new HttpError(
      "creating user failed, please try again later",
      500
    );
    return next(err);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      "superImportant_do_not_share",
      { expiresIn: "1h" }
    );
  } catch (error) {
    const err = new HttpError(
      "creating user failed, please try again later",
      500
    );
    return next(err);
  }

  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("Signing up failed please try again later", 500);
    return next(err);
  }

  if (!existingUser) {
    const err = new HttpError("invalid credentials could not log you in", 403);
    return next(err);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    const err = new HttpError(
      "couldnot log you in please check your credentials and try again later",
      500
    );
    return next(err);
  }

  if (!isValidPassword) {
    const err = new HttpError("invalid credentials could not log you in", 401);
    return next(err);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "superImportant_do_not_share",
      { expiresIn: "1h" }
    );
  } catch (error) {
    const err = new HttpError(
      "creating user failed, please try again later",
      500
    );
    return next(err);
  }

  res.status(200).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.login = login;
exports.signup = signup;
exports.getAllUsers = getAllUsers;
