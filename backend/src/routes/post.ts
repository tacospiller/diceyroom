import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createPost, editPost, getPost, listPost, PostDocument } from '../services/post';

const router = Router();

router.get('/list', async (req, res) => {
  const { filter } = JSON.parse(req.body) as { filter: Partial<PostDocument> };
  const list = await listPost(filter);
  // TODO: pagination 
  res.status(200).json(list);
});

router.get('/post/:postid', async (req, res) => {
  var postid = req.params["postid"];
  const post = await getPost(postid);
  res.status(200).json(post);
});

router.post('/add', requireAuth, async (req, res) => {
  var post = JSON.parse(req.body) as PostDocument;
  post.userid = req.session.user!.userid;
  await createPost(post);
  res.sendStatus(200);
});

router.post('/edit', requireAuth, async (req, res) => {
  var post = JSON.parse(req.body) as PostDocument;
  post.userid = req.session.user!.userid;
  await editPost(post);
  res.sendStatus(200);
});

export default router;
