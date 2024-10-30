const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

require("dotenv").config();

const app = express();

mongoose.set("strictPopulate", false);

app.use(cors());
app.options("*", cors());

// Middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(errorHandler);

// Routers
const productRoute = require("./routes/productRoute");
const categoryRoute = require("./routes/categoryRoute");
const userRoute = require("./routes/userRoute");
const orderRoute = require("./routes/orderRoute");

// API base URL
const api = process.env.API_URL;

// Routes
app.use(`${api}/products`, productRoute);
app.use(`${api}/categories`, categoryRoute);
app.use(`${api}/users`, userRoute);
app.use(`${api}/orders`, orderRoute);

// MongoDB Connection
mongoose
  .connect(process.env.CONNECTION_STRING, {
    dbName: "eshop-database",
  })
  .then(() => {
    console.log("Database Connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

// Server
app.listen(3000, () => {
  console.log("Server is running http://localhost:3000");
});
