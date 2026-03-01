const { Router } = require("express");
const authService = require("@/shared/services/auth-service");

module.exports = Router({ mergeParams: true }).post(
  "/v1/auth/logout",
  async (req, res, next) => {
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
        await authService.logout(token, req.db);
      }
      res.clearCookie("refreshToken");
      return res.json({ message: "Logged out" });
    } catch (err) {
      return next(err);
    }
  }
);
