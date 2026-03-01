const { Router } = require("express");
const validate = require("@/shared/middlewares/validate");
const authService = require("@/shared/services/auth-service");

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const validationSchema = {
  
}


module.exports = Router({ mergeParams: true }).post(
  "/v1/auth/refresh",
  validate(validationSchema),
  async (req, res, next) => {
    try {
      // Accept token from body or from httpOnly cookie
      const token = req.body.refreshToken || req.cookies?.refreshToken;
      const { user, tokens } = await authService.refresh(token, req.db);

      res.cookie("refreshToken", tokens.refreshToken, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: "strict",
      });

      return res.json({ user, accessToken: tokens.accessToken });
    } catch (err) {
      return next(err);
    }
  }
);
