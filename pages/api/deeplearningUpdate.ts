//https://www.deeplearning.ai/the-batch/tag/research/

import path from "path";
import { Blog, readCache, saveToCache, summarize } from "@/pages/api/service";
import axios from "axios";
import cheerio from "cheerio";
import { NextApiRequest, NextApiResponse } from "next";

export const THE_BATCH_BLOG_KEY = "the_batch_blog_key";

async function getLatestBlogsAndSave(): Promise<any> {
	try {
		const hubLink = "https://www.deeplearning.ai/the-batch/tag/research/";
		const response = await axios.get(hubLink);
		const html = response.data;
		const $ = cheerio.load(html);
		const blogs: Blog[] = [];
		const blogLinks: string[] = [];

		const div = $('div.p-6.flex.flex-col.items-start.h-full');
		div.each((_idx, element) => {
			if (blogLinks.length < 5) {
				const link = "https://www.deeplearning.ai" + $(element).find('a').eq(1).attr('href') || "";
				blogLinks.push(link)
			}
		});
		const cachedBlogs = await readCache(THE_BATCH_BLOG_KEY);
		const cachedTitles = cachedBlogs.map(blogs => blogs.title);


		for (const link of blogLinks) {
			const blogResponse = await axios.get(link);
			const blogHtml = blogResponse.data;
			const $blog = cheerio.load(blogHtml);

			const title = $blog('h1').text().trim();

			const date = $blog('div.mt-1.text-slate-600.text-base.undefined > a > div').text().trim();
			if (!cachedTitles.includes(title)) {
				const paragraphs: string[] = [];
				$blog('*').each((index, element) => {
					// @ts-ignore
					if (element.tagName === 'p' || (element.tagName === 'li' && $blog(element).text().trim().length > 20)) {
						paragraphs.push($blog(element).text().trim());
					}
				});
				const content = paragraphs.join('\n');
				const summary = await summarize(content);
				blogs.push({
					title: title,
					date: date,
					link: link,
					summary: summary,
				});
			}
		}
		if (blogs.length > 0) {
			await saveToCache(blogs, THE_BATCH_BLOG_KEY);
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