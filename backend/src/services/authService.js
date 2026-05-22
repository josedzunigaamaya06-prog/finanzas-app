const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const register = async ({ email, password, name, currency }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('El correo ya está registrado'), { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, currency: currency || 'COP' },
    select: { id: true, email: true, name: true, currency: true, createdAt: true },
  });

  const tokens = generateTokens(user.id);
  return { user, ...tokens };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });

  const { password: _, ...userWithoutPassword } = user;
  const tokens = generateTokens(user.id);
  return { user: userWithoutPassword, ...tokens };
};

const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Refresh token inválido'), { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true, currency: true },
  });
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 401 });

  const tokens = generateTokens(user.id);
  return { user, ...tokens };
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const resetToken = uuidv4();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  return resetToken;
};

const resetPassword = async (token, newPassword) => {
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) throw Object.assign(new Error('Token inválido o expirado'), { status: 400 });

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
  });
};

const updateProfile = async (userId, data) => {
  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.currency) updateData.currency = data.currency;
  if (data.timezone) updateData.timezone = data.timezone;
  if (data.avatar) updateData.avatar = data.avatar;

  if (data.currentPassword && data.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) throw Object.assign(new Error('Contraseña actual incorrecta'), { status: 400 });
    updateData.password = await bcrypt.hash(data.newPassword, 12);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, name: true, currency: true, timezone: true, avatar: true, createdAt: true },
  });
};

module.exports = { register, login, refreshToken, forgotPassword, resetPassword, updateProfile };
