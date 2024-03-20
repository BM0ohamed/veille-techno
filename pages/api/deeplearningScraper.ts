import { NextApiRequest, NextApiResponse } from 'next';
import { readCache } from "@/pages/api/service";
import { THE_BATCH_BLOG_KEY } from "@/pages/api/deeplearningUpdate";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'GET') {
		try {
			const cachedBlogs = await readCache(THE_BATCH_BLOG_KEY);
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