const express = require("express");
const serverless = require("serverless-http");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();
const cookieParser = require("cookie-parser");
const sendToken = require("./utils/jwtToken");
const authenticate = require("./middleware/authenticate");

const app = express();

const cors = require('cors');

app.use(cors({
  origin: 'https://www.nisecomport.com/'
}));
require("./db/conn");
const User = require("./model/userSchema");
router.use(cookieParser());
router.get("/", (req, res) => {
  res.send(`Hello world from the server rotuer js`);
});

router.post("/register", async (req, res) => {
  const { name, email, phone, work, password, cpassword } = req.body;
  // if (!name || !email || !phone || !work || !password || !cpassword) {
  if (!name || !email || !password || !cpassword) {
    return res.status(422).json({ error: "Wrong Data Kindly fill it." });
  }
  try {
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      return res.status(422).json({ error: "Email already exist" });
    } else if (password !== cpassword) {
      return res.status(422).json({ error: "Password is not matching" });
    } else {
      const user = new User({ name, email, phone, work, password, cpassword });

      await user.save();
      res.status(201).json({ message: "User Register Successfully." });
    }
  } catch (err) {
    console.log(err);
  }
});

router.get("/profile", authenticate, (req, res) => {
  res.send(req.rootUser);
});

router.get("/about", (req, res) => {
  res.send(`Hello About world from the server`);
});

router.get("/contact", (req, res) => {
  res.cookie(`Contact`, `encrypted cookie string Value`);
  res.send("Cookie have been saved successfully");
});
router.post("/cont", (req, res) => {
  res.cookie(`Cont`, `encrypted cookie string Value`);
  res.send("Cont have been saved successfully");
});

router.post("/signin", async (req, res) => {
  try {
    let token;
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please fill the data" });
    }

    const userLogin = await User.findOne({ email: email });
    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);
      console.log("userLogin", userLogin);
      if (!isMatch) {
        res.status(400).json({ error: "Invalid Credentials!" });
      } else {
        // res.json({ message: "User Signed Successfully." });
        // token = await userLogin.generateAuthToken();
        // console.log(token);
        // res
        //   .cookie("nisecomport", token, {
        //     expires: new Date(Date.now() + 2589200000),
        //     httpOnly: true,
        //   })
        //   .json({
        //     success: true,
        //     token,
        //   });
        sendToken(userLogin, 201, res);
      }
    } else {
      res.status(400).json({ error: "Invalid Credentials!" });
    }
  } catch (err) {
    console.log(err);
  }
});
app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);