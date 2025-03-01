// Existing session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    sameSite: 'lax',
    maxAge: 86400000,
    httpOnly: true,
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
  },
  rolling: true,
  proxy: true,
  store: new MemoryStore({
    checkPeriod: 86400000 // 24 hours
  })
})); 