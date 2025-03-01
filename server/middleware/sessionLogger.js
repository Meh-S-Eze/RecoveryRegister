const { authLogger } = require('../core/utils/logger');

module.exports = (req, res, next) => {
  authLogger.debug('Session state', {
    sessionId: req.sessionID,
    userStatus: req.session.user ? 'authenticated' : 'anonymous',
    authMethod: req.session.user?.identityType,
    adminAccess: req.session.user?.role === 'admin'
  });
  
  if (req.session.user?.role === 'admin') {
    authLogger.warn('Admin session activity', {
      path: req.path,
      method: req.method
    });
  }
  
  next();
}; 