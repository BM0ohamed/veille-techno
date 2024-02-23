import fs from 'fs';
import { promisify } from 'util';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import cheerio from 'cheerio';
import { pipeline } from '@xenova/transformers';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

export interface HfBlog {
	title: string,
	date: string,
	summary: string,
	link: string,
}

async function getLatestBlogs(): Promise<HfBlog[]> {
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

		// Fetch content and extract basic information for each blog
		for (const link of blogLinks) {
			const blogResponse = await axios.get(link);
			const blogHtml = blogResponse.data;
			const $blog = cheerio.load(blogHtml);

			// Extract blog title and date
			const title = $blog('h1').text().trim();
			const date = $blog('time').attr('datetime') || '';

			blogs.push({
				title,
				date,
				link: link,
				summary: '', // Summary will be filled later
			});
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

async function readCache(): Promise<HfBlog[]> {
	try {
		const data = await readFileAsync('articles_cache.csv', 'utf8');
		const lines = data.trim().split('\n');
		const cachedBlogs: HfBlog[] = lines.map(line => {
			const [title, date, summary] = line.split(',').map(field => field.replace(/"/g, ''));
			return { title, date, summary, link: '' }; // Assuming link is not stored in the cache
		});
		return cachedBlogs;
	} catch (error) {
		// If the cache file does not exist or there is a read error, return an empty array
		return [];
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
			const latestBlogs = await getLatestBlogs();
			const cachedBlogs = await readCache();
			const cachedTitles = cachedBlogs.map(blogs => blogs.title);
			const newTitles = latestBlogs.filter(blog => !cachedTitles.includes(blog.title));

			if (newTitles.length > 0) {
				const newBlogs: HfBlog[] = [];

				for (const blog of latestBlogs) {
					if (newTitles.some(newBlog => newBlog.title === blog.title)) {
						const blogResponse = await axios.get(`https://huggingface.co/${blog.title}`);
						const blogHtml = blogResponse.data;
						const $blog = cheerio.load(blogHtml);

						const paragraphs: string[] = [];
						$blog('p').each((_idx, element) => {
							paragraphs.push($blog(element).text().trim());
						});

						const content = paragraphs.join('\n');
						const summary = await summarize(content);

						newBlogs.push({
							title: blog.title,
							date: blog.date,
							link: blog.link,
							summary: summary,
						});
					} else {
						newBlogs.push(blog);
					}
				}

				await saveToCache([...latestBlogs, ...newBlogs]);
				res.status(200).json(newBlogs);
			} else {
				res.status(200).json(cachedBlogs);
			}
		} catch (error) {
			console.error('Error handling request:', error);
			res.status(500).json({ message: 'Error handling request' });
		}
	} else {
		res.setHeader('Allow', ['GET']);
		res.status(405).end(`Method ${req.method} Not Allowed`);
	}
}
