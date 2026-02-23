// config/passport.js
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { validateUser } from "../userModule.js";

passport.use(
  new LocalStrategy(async (username, password, cb) => {
    try {
      const user = await validateUser(username, password);

      if (!user) {
        return cb(null, false, { message: "Incorrect username or password." });
      }

      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }),
);

passport.serializeUser((user, cb) => {
  cb(null, {
    id: user._id,
    name: user.name,
    role: user.role,
  });
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

export default passport;
