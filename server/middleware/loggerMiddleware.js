// server/middleware/loggerMiddleware.js
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;
    
    if (res.statusCode >= 400) {
      console.error('❌ ' + logMessage);
      console.error('   Body:', req.body);
      console.error('   Query:', req.query);
      console.error('   Params:', req.params);
    } else {
      console.log('✅ ' + logMessage);
    }
  });
  
  next();
};

export const downloadLogger = (req, res, next) => {
  if (req.path.includes('/download/') || req.path.includes('/pdf')) {
    console.log('📥 Download request:', {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }
  next();
};