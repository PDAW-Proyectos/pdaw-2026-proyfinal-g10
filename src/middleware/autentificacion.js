
  
  
  
  export const requireAuth = (req, res, next) =>
    req.user ? next() : res.status(401).json({ error: 'Es necesario iniciar sesión' });
