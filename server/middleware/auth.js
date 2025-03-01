// Updated admin session validation
const validateAdminSession = (req, res, next) => {
  if (req.session.user?.securityProfile === 'admin' && 
      req.session.user?.role === 'admin') {
    console.log('Admin session validated:', req.sessionID);
    return next();
  }
  
  console.log('Admin validation failed for session:', req.sessionID);
  req.session.destroy();
  return res.redirect('/admin/login');
}; 