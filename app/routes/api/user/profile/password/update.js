const { Router } = require("express");
const auth = require("@/shared/middlewares/auth");
const ApiError = require("@/shared/errors/ApiError");

module.exports = Router({ mergeParams: true }).get("/api/user/profile/password/update", auth, async (req, res, next) => {
	try {
		const user = await req.db.User.findOne({ username: req.params.username });

		if (!user) {
			return next(ApiError.notFound(`User '${req.params.username}' not found`));
		}

		return res.json(user.toDTO());
	} catch (err) {
		return next(err);
	}
});
