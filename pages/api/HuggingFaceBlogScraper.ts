import fs from 'fs';
import { promisify } from 'util';
import { NextApiRequest, NextApiResponse } from 'next';
import path from "path";

const CSV_FILE_PATH = path.join(process.cwd(),  'dataset', 'articles_cache.csv');

const readFileAsync = promisify(fs.readFile);

export interface HfBlog {
	title: string,
	date: string,
	summary: string,
	link: string,

}

async function readCache(): Promise<HfBlog[]> {
	try {
		const data = await readFileAsync(CSV_FILE_PATH, 'utf8');
		const lines = data.trim().split('\n');
		const cachedBlogs: HfBlog[] = lines.map(line => {
			const [title, date, summary] = line.split(',').map(field => field.replace(/"/g, ''));
			return {title, date, summary, link: ''}; // Assuming link is not stored in the cache
		});
		return cachedBlogs;
	} catch (error) {
		// If the cache file does not exist or there is a read error, return an empty array
		return [];
	}
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'GET') {
		try {
			const cachedBlogs = await readCache();
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