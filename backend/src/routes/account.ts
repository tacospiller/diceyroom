import { Router } from 'express';
import '../types/session';
import { join, login, InvalidUsernameError, UsernameTakenError } from '../services/account';
import { nanoid } from 'nanoid';

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
  const sid = nanoid();
  req.session.user = { username: user.username, userid: user.userid, sessionid:sid };
  res.status(200).json({ username: user.username, userid: user.userid, sessionId: sid });
});

export default router;
