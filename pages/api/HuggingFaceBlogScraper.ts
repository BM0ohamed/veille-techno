// pages/api/HuggingFaceBlogScraper.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import cheerio from 'cheerio';

export interface HfBlog {
	title: string,
	image: string,
	link: string,

}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method === 'GET') {
		try {
			const response = await axios.get('https://huggingface.co/blog?tag=research');
			const html = response.data;
			const $ = cheerio.load(html);
			const blogs: HfBlog[] = [];

			$('a.flex.rounded-xl.border-gray-100').each((_idx, element) => {
				if (blogs.length < 5) {
					const title = $(element).find('h2').text().trim();
					const image = "https://huggingface.co" + $(element).find('img').attr('src') || ''; // Extract image source
					const link = "https://huggingface.co" + $(element).attr('href') || ''; // Extract article link

					blogs.push({
						title: title,
						image: image,
						link: link,
					});
				}
			});

			res.status(200).json(blogs);
		} catch (error) {
			console.error('Error fetching blog titles:', error);
			res.status(500).json({message: 'Error fetching blog titles'});
		}
	} else {
		res.setHeader('Allow', ['GET']);
		res.status(405).end(`Method ${req.method} Not Allowed`);
	}
}
