const User = require("../model/userModel");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash");

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) {
    res
      .status(500)
      .json({ message: "The user with the given ID was not found" });
  }
  res.status(200).send(user);
});

router.post("/", async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();

  if (!user) return res.status(404).send("the user cannot be created!");

  res.send(user);
});

router.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.secret;

    if (!user) {
      console.log("The user not found");
      return res.status(400).send("The user not found");
    }

    console.log("User found:", user);

    const passwordMatch = bcrypt.compareSync(
      req.body.password,
      user.passwordHash
    );
    console.log("Password match status:", passwordMatch);

    if (passwordMatch) {
      const token = jwt.sign(
        {
          userId: user.id,
          isAdmin: user.isAdmin,
        },
        secret,
        { expiresIn: "1d" }
      );
      console.log("Token generated:", token);
      return res.status(200).send({ user: user.email, token: token });
    } else {
      console.log("Password is wrong!");
      return res.status(400).send("The password is wrong!");
    }
  } catch (err) {
    console.log("Error during login:", err);
    next(err);
  }
});

router.post("/register", async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();

  if (!user) return res.status(400).send("the user cannot be created!");

  res.send(user);
});

router.get("/get/count", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({
      userCount: userCount,
    });
  } catch (err) {
    console.log("Error during getting user count:", err);
    next(err);
  }
});

module.exports = router;
