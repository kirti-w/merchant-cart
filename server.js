import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import { validateUser } from "./userModule.js";
import { ensureAuthenticated, ensureAuthorized } from "./middleware/auth.js";

// configure passport strategy
passport.use(
  new LocalStrategy(function (username, password, cb) {
    process.nextTick(async function () {
      const user = await validateUser(username, password);
      if (!user) {
        return cb(null, false, { message: "Incorrect username or password." });
      } else {
        return cb(null, user);
      }
    });
  }),
);

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

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Serialize user information
passport.serializeUser((user, cb) => {
  console.log("Serialize", user);
  cb(null, {
    id: user._id,
    name: user.name,
    role: user.role,
  });
});

// Deserialize user information
passport.deserializeUser((obj, cb) => {
  console.log("DeSerialize", obj);
  cb(null, obj);
});

app.get("/login", function (req, res) {
  res.render("login", {
    user: req.user,
    messages: req.session.messages,
  });
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.render("login", {
        messages: info?.message || "Invalid username or password.",
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      if (user.role === "admin") {
        return res.redirect("/admin/products");
      } else {
        return res.redirect("/products");
      }
    });
  })(req, res, next);
});

// protected route middleware function
/*
export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}*/

app.get("/account", ensureAuthenticated, function (req, res) {
  res.render("account", { user: req.user });
});

// protected route middleware function
/*
export const ensureAuthorized = (requiredRole) => {
  return (req, res, next) => {
    if (req.isAuthenticated) {
      const user = req.user;
      if (user?.role === requiredRole) {
        return next();
      } else {
        res.render("error", {
          user: req.user,
          message: "Insufficient access permissions",
        });
      }
    } else {
      res.redirect("/login");
    }
  };
};
*/
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
