const secure = (req, res, next) => {
  if (req.auth && req.auth.userId) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};
export default secure;
