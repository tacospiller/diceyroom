import { Router } from 'express';
import { nanoid } from 'nanoid';

const router = Router();

router.get('/values', async (req, res) => {
    var metaVals = {
        rules: [
            {
                id: "coc",
                displayName: "크툴루의 부름(CoC)",
                alts: ["call of cthulu", "씨오씨", "쑈씨"]
            },
            {
                id: "insane",
                displayName: "인세인",
                alts: ["insane"]
            },
            {
                id: "magicalogia",
                displayName: "마기카로기아",
                alts: ["마기로기", "마도서대전"]
            },
            {
                id: "shinobigami",
                displayName: "시노비가미",
                alts: ["닌자"]
            },
            {
                id: "dx3rd",
                displayName: "더블크로스 3rd",
                alts: ["덥크", "double cross"]
            },
            {
                id: "dnd",
                displayName: "던전 앤 드래곤",
                alts: ["dungeons and dragons"]
            },
            {
                id: "unsungduet",
                displayName: "언성듀엣",
                alts: ["언듀"]
            },
            {
                id: "fiasco",
                displayName: "피아스코",
                alts: ["피앗"]
            },
            {
                id: "agon",
                displayName: "아곤",
                alts: []
            },
            {
                id: "numenera",
                displayName: "누메네라",
                alts: []
            }
        ],
    };

    res.status(200).json(metaVals);
});


export default router;
