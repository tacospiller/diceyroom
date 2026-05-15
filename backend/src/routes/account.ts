import { Router } from 'express';
import '../types/session';
import { join, login, InvalidUsernameError, UsernameTakenError } from '../services/account';

const router = Router();

router.post('/join', async (req, res) => {
  const { username, passhash } = req.body as { username: string; passhash: string };
  try {
    await join(username, passhash);
    res.sendStatus(200);
  } catch (err) {
    if (err instanceof InvalidUsernameError) { res.sendStatus(400); return; }
    if (err instanceof UsernameTakenError) { res.sendStatus(409); return; }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const { username, passhash } = req.body as { username: string; passhash: string };
  const user = await login(username, passhash);
  if (!user) {
    res.sendStatus(401);
    return;
  }
  req.session.user = { username: user.username, userid: user.userid };
  res.sendStatus(200);
});

export default router;
