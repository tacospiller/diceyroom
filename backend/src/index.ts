import express from 'express';
import cors from 'cors';
import session from 'express-session';
import accountRouter from './routes/account';
import postRouter from './routes/post';
import metaRouter from './routes/meta';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/account', accountRouter);
app.use('/api/post', postRouter);
app.use('/api/meta', metaRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
