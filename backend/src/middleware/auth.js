import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'najot-edu-secret-2026';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token mavjud emas', statusCode: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token yaroqsiz yoki muddati tugagan', statusCode: 401 });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Autentifikatsiya talab qilinadi' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Ruxsat yo\'q', statusCode: 403 });
    }
    next();
  };
}
