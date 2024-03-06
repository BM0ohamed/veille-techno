import axios from "axios";
import cheerio from "cheerio";
import { HfBlog, readCache } from "@/pages/api/HuggingFaceBlogScraper";
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from "@xenova/transformers";
import { NextApiRequest, NextApiResponse } from "next";

const writeFileAsync = promisify(fs.writeFile);

async function getLatestBlogsAndSave(): Promise<HfBlog[]> {
	try {
		const response = await axios.get('https://huggingface.co/blog?tag=research');
		const html = response.data;
		const $ = cheerio.load(html);
		const blogs: HfBlog[] = [];

		const blogLinks: string[] = [];

		// Extract links to each blog
		$('a.flex.rounded-xl.border-gray-100').each((_idx, element) => {
			if (blogLinks.length < 5) {
				const link = "https://huggingface.co" + $(element).attr('href') || '';
				blogLinks.push(link);
			}
		});
		const cachedBlogs = await readCache();
		const cachedTitles = cachedBlogs.map(blogs => blogs.title);

		// Fetch content and extract basic information for each blog
		for (const link of blogLinks) {
			const blogResponse = await axios.get(link);
			const blogHtml = blogResponse.data;
			const $blog = cheerio.load(blogHtml);

			// Extract blog title and date
			const title = $blog('h1').text().trim();
			const date = $blog('time').attr('datetime') || '';


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
			await saveToCache(blogs);
		}
		return blogs;
	} catch (error) {
		console.error('Error fetching latest blogs:', error);
		return [];
	}
}

async function summarize(text: string): Promise<string> {
	try {
		const generator = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6');
		const output = await generator(text, {
			max_new_tokens: 100,
		});
		// @ts-ignore
		return output[0]?.summary_text || '';
	} catch (error) {
		console.error('Error summarizing text:', error);
		return '';
	}
}

async function saveToCache(blogs: HfBlog[]): Promise<void> {
	const csvContent = blogs.map(blog => `"${blog.title}","${blog.date}","${blog.summary}"`).join('\n');
	try {
		await writeFileAsync('articles_cache.csv', csvContent, 'utf8');
		console.log('Cache updated successfully.');
	} catch (error) {
		console.error('Error updating cache:', error);
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