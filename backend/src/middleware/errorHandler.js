const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'Ya existe un registro con estos datos',
      field: err.meta?.target,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Registro no encontrado' });
  }

  res.status(statusCode).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
