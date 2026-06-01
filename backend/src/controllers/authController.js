import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/db.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export async function register(req, res) {
  const data = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 10);
  const result = await query(
    'INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email',
    [data.name, data.email, passwordHash]
  );
  res.status(201).json(result.rows[0]);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const result = await query('SELECT * FROM users WHERE email=$1', [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}
