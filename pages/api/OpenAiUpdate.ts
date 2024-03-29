import path from "path";
import { Blog, readCache, saveToCache, summarize } from "@/pages/api/service";
import axios from "axios";
import cheerio from "cheerio";
import { NextApiRequest, NextApiResponse } from "next";

export const OPEN_AI_BLOG_KEY = "open_ai";

async function getLatestBlogsFromOpenAiAndSave(): Promise<any> {
	try {
		const response = await axios.get('https://openai.com/blog')
		const html = response.data;
		const $ = cheerio.load(html);
		const blogs: Blog[] = [];
		const links: string[] = [];
		$('li[class*="mt-spacing"]').each((index, element) => {
			if (links.length < 5) {
				const link = "https://openai.com" + $(element).find('a').attr('href') || '';
				links.push(link);
			}
		});
		const cachedBlogs = await readCache(OPEN_AI_BLOG_KEY);
		const cachedTitles = cachedBlogs.map(blogs => blogs.title);

		for (const link of links) {
			const blogResponse = await axios.get(link);
			const blogHtml = blogResponse.data
			const blog$ = cheerio.load(blogHtml);

			const title = blog$('h1.f-display-2').text().trim();
			const date = blog$('span.f-meta-2').text().trim();

			if (!cachedTitles.includes(title)) {
				const paragraphs: string[] = [];
				blog$('p').each((index, element) => {
					paragraphs.push(blog$(element).text().trim());
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
			await saveToCache(blogs, OPEN_AI_BLOG_KEY);
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
			const blogsFromOpenAi = await getLatestBlogsFromOpenAiAndSave();
			res.status(200).json([...blogsFromOpenAi]);
		} catch (error) {
			console.error('Error in API handler:', error);
			res.status(500).json({message: 'Internal server error'});
		}
	} else {
		res.setHeader('Allow', ['GET']);
		res.status(405).end('Method Not Allowed');
	}
}