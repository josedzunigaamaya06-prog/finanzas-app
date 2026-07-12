const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const prisma = require('../lib/prisma');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const { sendVerificationEmail } = require('./emailService');

// Código de verificación de 6 dígitos con vencimiento corto.
const generateVerificationCode = () => {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
  return { code, expiry };
};

const register = async ({ email, password, name, currency }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('El correo ya está registrado'), { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 12);
  const { code, expiry } = generateVerificationCode();

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      currency: currency || 'COP',
      isVerified: false,
      verificationCode: code,
      verificationCodeExpiry: expiry,
    },
    select: { id: true, email: true, name: true },
  });

  const emailSent = await sendVerificationEmail({ email: user.email, name: user.name, code });

  // Sin tokens hasta que el correo esté verificado.
  return { requiresVerification: true, email: user.email, emailSent };
};

const verifyEmail = async ({ email, code }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Código inválido o expirado'), { status: 400 });
  if (user.isVerified) throw Object.assign(new Error('Esta cuenta ya está verificada. Inicia sesión.'), { status: 400 });

  const valid =
    user.verificationCode &&
    user.verificationCode === String(code).trim() &&
    user.verificationCodeExpiry &&
    user.verificationCodeExpiry > new Date();

  if (!valid) throw Object.assign(new Error('Código inválido o expirado'), { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, verificationCode: null, verificationCodeExpiry: null },
  });

  const { password: _, verificationCode: __, verificationCodeExpiry: ___, ...userSafe } = user;
  const tokens = generateTokens(user.id);
  return { user: { ...userSafe, isVerified: true }, ...tokens };
};

const resendVerification = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Respuesta genérica siempre: no revelar si el correo existe.
  if (!user || user.isVerified) return { emailSent: false };

  const { code, expiry } = generateVerificationCode();
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationCode: code, verificationCodeExpiry: expiry },
  });

  const emailSent = await sendVerificationEmail({ email: user.email, name: user.name, code });
  return { emailSent };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });

  if (!user.isVerified) {
    throw Object.assign(new Error('Tu cuenta aún no está verificada. Te enviamos un código a tu correo.'), {
      status: 403,
    });
  }

  const { password: _, verificationCode: __, verificationCodeExpiry: ___, ...userWithoutPassword } = user;
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

const DEMO_EMAIL = 'demo@finanzas.app';

const updateProfile = async (userId, data) => {
  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.currency) updateData.currency = data.currency;
  if (data.timezone) updateData.timezone = data.timezone;
  if (data.avatar) updateData.avatar = data.avatar;

  if (data.currentPassword && data.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // La cuenta demo es pública: si alguien le cambia la contraseña, bloquea la demo para todos
    if (user.email === DEMO_EMAIL) {
      throw Object.assign(new Error('La cuenta demo no permite cambiar la contraseña'), { status: 403 });
    }
    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) throw Object.assign(new Error('Contraseña actual incorrecta'), { status: 400 });
    updateData.password = await bcrypt.hash(data.newPassword, 12);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, name: true, currency: true, timezone: true, avatar: true, plan: true, createdAt: true },
  });
};

// Eliminación de cuenta (derecho de supresión — Ley 1581 de habeas data).
// Borra al usuario y TODOS sus datos: las relaciones tienen onDelete: Cascade,
// así que gastos, ingresos, deudas, metas, billeteras, etc. se eliminan con él.
const deleteAccount = async (userId, password) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });

  if (user.email === DEMO_EMAIL) {
    throw Object.assign(new Error('La cuenta demo no se puede eliminar'), { status: 403 });
  }

  if (!password) throw Object.assign(new Error('Contraseña requerida para eliminar la cuenta'), { status: 400 });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Contraseña incorrecta'), { status: 400 });

  await prisma.user.delete({ where: { id: userId } });
};

module.exports = { register, verifyEmail, resendVerification, login, refreshToken, forgotPassword, resetPassword, updateProfile, deleteAccount };
