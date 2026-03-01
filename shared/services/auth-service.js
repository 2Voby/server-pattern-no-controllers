const bcrypt = require("bcrypt");
const ApiError = require("@/shared/errors/ApiError");
const tokenService = require("@/shared/services/token-service");

const SALT_ROUNDS = 12;

const authService = {
  /**
   * @param {{ username, email, password }} data
   * @param {{ User, Tokens }} db
   */
  async register({ username, password, email }, db) {
    const existing = await db.User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }],
    });
    if (existing) {
      throw ApiError.conflict("Username or email already taken");
    }

    const hashPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await db.User.create({ username, password: hashPassword, email });

    const dto = user.toDTO();
    const tokens = tokenService.generateTokens({ user: dto });
    await tokenService.saveToken(dto.id, tokens.refreshToken, db.Tokens);

    return { user: dto, tokens };
  },

  /**
   * @param {{ login, password }} data  — login is email OR username
   * @param {{ User, Tokens }} db
   */
  async login({ login, password }, db) {
    const user = await db.User.findOne({
      $or: [{ email: login.toLowerCase() }, { username: login }],
    });
    if (!user) {
      throw ApiError.badRequest("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.badRequest("Invalid credentials");
    }

    const dto = user.toDTO();
    const tokens = tokenService.generateTokens({ user: dto });
    await tokenService.saveToken(dto.id, tokens.refreshToken, db.Tokens);

    return { user: dto, tokens };
  },

  async refresh(refreshToken, db) {
    const payload = tokenService.validateRefreshToken(refreshToken);
    const tokenDoc = await tokenService.findToken(refreshToken, db.Tokens);

    if (!payload || !tokenDoc) {
      throw ApiError.unauthorized("Refresh token is invalid or expired");
    }

    const user = await db.User.findById(payload.user.id);
    if (!user) throw ApiError.notFound("User not found");

    const dto = user.toDTO();
    const tokens = tokenService.generateTokens({ user: dto });
    await tokenService.saveToken(dto.id, tokens.refreshToken, db.Tokens);

    return { user: dto, tokens };
  },

  async logout(refreshToken, db) {
    return tokenService.removeToken(refreshToken, db.Tokens);
  },
};

module.exports = authService;
