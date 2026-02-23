import passport from "./config/passport.js";
import { ensureAuthenticated, ensureAuthorized } from "./middleware/auth.js";

import express from "express";

const app = express();

// setup handlebars view engine
import { engine } from "express-handlebars";

//View engine setup and use custom helpers
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    helpers: {
      decode: (value) => decodeURIComponent(value),
      eq: (a, b) => a === b,
      multiply: (a, b) => a * b,
      formatDate: (date) => {
        return formatDate(date);
      },
      round: (value) => parseFloat(value.toFixed(2)),
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

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Routing
import { router as routes } from "./routes/index.js";

import { router as adminRoutes } from "./routes/admin-routes.js";

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.cartCount = req.session.cart?.length || 0;
  res.locals.currentPath = req.path;
  next();
});

//Ensure user is authenticated and has admin role for all /admin routes
app.use("/admin", ensureAuthenticated, ensureAuthorized("admin"), adminRoutes);

app.use("/", routes);

app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

app.listen(3000, function () {
  console.log("http://localhost:3000");
});
function formatDate(date) {
  const d = new Date(date);

  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${month}-${day}-${year} ${hours}:${minutes}`;
}
