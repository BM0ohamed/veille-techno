import path from "path";
import { NextApiRequest, NextApiResponse } from "next";
import { readCache } from "@/pages/api/service";
import { OPEN_AI_BLOG_KEY } from "@/pages/api/OpenAiUpdate";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'GET') {
		try {
			const cachedBlogs = await readCache(OPEN_AI_BLOG_KEY);
			res.status(200).json(cachedBlogs);
		} catch (error) {
			console.error('Error handling request:', error);
			res.status(500).json({message: 'Error handling request'});
		}
	} else {
		res.setHeader('Allow', ['GET']);
		res.status(405).end(`Method ${req.method} Not Allowed`);
	}
}