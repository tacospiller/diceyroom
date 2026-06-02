import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createPost, editPost, getPost, listPost } from '../services/post';
import { PostCreationRequest, PostFilterRequest } from '../services/DTO/postDTOs';

const router = Router();

router.get('/list', async (req, res) => {
  const filter = (req.query ?? {}) as PostFilterRequest;
  const list = await listPost(filter);
  // TODO: pagination
  res.status(200).json(list);
});

router.get('/post/:postid', async (req, res) => {
  const postid = req.params["postid"];
  const post = await getPost(req.session.user!.userid, postid);
  res.status(200).json(post);
});

router.post('/add', requireAuth, async (req, res) => {
  const post = req.body as PostCreationRequest;
  await createPost(req.session.user!.userid, post);
  res.sendStatus(200);
});

router.post('/edit/:postid', requireAuth, async (req, res) => {
  const post = req.body as PostCreationRequest;
  await editPost(req.session.user!.userid, req.params["postid"], post);
  res.sendStatus(200);
});

export default router;
