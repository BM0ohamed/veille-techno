import axios from "axios";
import cheerio from "cheerio";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import { Blog, readCache, saveToCache, summarize } from "@/pages/api/service";

const CSV_FILE_PATH = path.join(process.cwd(), 'dataset', 'articles_cache.csv');


async function getLatestBlogsAndSave(): Promise<Blog[]> {
	try {
		const response = await axios.get('https://huggingface.co/blog?tag=research');
		const html = response.data;
		const $ = cheerio.load(html);
		const blogs: Blog[] = [];

		const blogLinks: string[] = [];

		// Extract links to each blog
		$('a.flex.rounded-xl.border-gray-100').each((_idx, element) => {
			if (blogLinks.length < 5) {
				const link = "https://huggingface.co" + $(element).attr('href') || '';
				blogLinks.push(link);
			}
		});
		const cachedBlogs = await readCache(CSV_FILE_PATH);
		const cachedTitles = cachedBlogs.map(blogs => blogs.title);

		// Fetch content and extract basic information for each blog
		for (const link of blogLinks) {
			const blogResponse = await axios.get(link);
			const blogHtml = blogResponse.data;
			const $blog = cheerio.load(blogHtml);

			// Extract blog title and date
			const title = $blog('h1').text().trim();
			let date = $blog('div.mb-4.flex.items-center.gap-x-4.text-base span').text().trim() || '';
			// Clean up the date string
			date = date.replace(/^Published\s+|\s+$/g, ''); // Remove leading and trailing spaces
			date = date.replace(/^(\w+\s+\d+,\s+\d+).*/g, '$1'); // Extract only the date part


			if (!cachedTitles.includes(title)) {

				const paragraphs: string[] = [];
				$blog('p').each((_idx, element) => {
					paragraphs.push($blog(element).text().trim());
				});
				const content = paragraphs.join('\n');
				const summary = await summarize(content);

				blogs.push({
					title,
					date,
					link: link,
					summary: summary,
				});
			}
		}
		if (blogs.length > 0) {
			await saveToCache(CSV_FILE_PATH, blogs);
		}
		return blogs;
	} catch (error) {
		console.error('Error fetching latest blogs:', error);
		return [];
	}
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'GET') {
		try {
			const blogs = await getLatestBlogsAndSave();
			res.status(200).json(blogs);
		} catch (error) {
			console.error('Error in API handler:', error);
			res.status(500).json({message: 'Internal server error'});
		}
	} else {
		res.setHeader('Allow', ['GET']);
		res.status(405).end('Method Not Allowed');
	}
}