const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { email, password, name, currency } = req.body;
    const result = await authService.register({ email, password, name, currency });
    res.status(201).json({ message: 'Registro exitoso', ...result });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json({ message: 'Login exitoso', ...result });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token requerido' });
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.json({ message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

const getProfile = async (req, res) => {
  res.json({ user: req.user });
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json({ message: 'Perfil actualizado', user });
  } catch (err) {
    if (err.status) res.status(err.status);
    next(err);
  }
};

module.exports = { register, login, refresh, forgotPassword, resetPassword, getProfile, updateProfile };
