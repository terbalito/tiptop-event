// server/middleware/errorMiddleware.js
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.message
    });
  }

  // Erreurs Firebase
  if (err.code && err.code.startsWith('firebase/')) {
    return res.status(400).json({
      error: 'Erreur Firebase',
      details: err.message
    });
  }

  // Erreur 404
  if (err.status === 404) {
    return res.status(404).json({
      error: 'Ressource non trouvée'
    });
  }

  // Erreur par défaut
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};