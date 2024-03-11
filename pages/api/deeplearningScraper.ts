import { NextApiRequest, NextApiResponse } from 'next';
import path from "path";
import { readCache } from "@/pages/api/service";

const CSV_FILE_PATH = path.join(process.cwd(), 'dataset', 'deeplearning.csv');


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'GET') {
		try {
			const cachedBlogs = await readCache(CSV_FILE_PATH);
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