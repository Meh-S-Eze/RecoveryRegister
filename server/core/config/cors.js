module.exports = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : ['https://*.replit.dev', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}; 