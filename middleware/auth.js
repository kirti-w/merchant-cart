export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

export const ensureAuthorized = (requiredRole) => {
  return (req, res, next) => {
    if (req.isAuthenticated()) {
      // ✅ FIX: must CALL it
      if (req.user?.role === requiredRole) {
        return next();
      } else {
        return res.render("error", {
          user: req.user,
          message: "Insufficient access permissions",
        });
      }
    } else {
      res.redirect("/login");
    }
  };
};
