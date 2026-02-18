import express from "express";

const app = express();

// setup handlebars view engine
import { engine } from "express-handlebars";

app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    helpers: {
      decode: (value) => decodeURIComponent(value),
      eq: (a, b) => a === b,
      multiply: (a, b) => a * b,
    },
  }),
);
app.set("view engine", "handlebars");
app.set("views", "./views");

// static resources
app.use(express.static("./public"));

// to parse request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

import cookieParser from "cookie-parser";
import expressSession from "express-session";

// cookie-parser first
app.use(cookieParser());
// session
app.use(
  expressSession({
    secret: "cart-secret",
    resave: false,
    saveUninitialized: false,
  }),
);

// Routing
import { router as routes } from "./routes/index.js";

import { router as adminRoutes } from "./routes/admin-routes.js";

app.use("/admin", adminRoutes);

app.use("/", routes);

app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

app.listen(3000, function () {
  console.log("http://localhost:3000");
});
