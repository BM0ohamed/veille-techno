import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import cheerio from 'cheerio';
import { pipeline } from '@xenova/transformers';

export interface HfBlog {
	title: string,
	image: string,
	link: string,
	summary?: string,
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

			const blogLinks: string[] = [];

			// Extract links to each blog
			$('a.flex.rounded-xl.border-gray-100').each((_idx, element) => {
				if (blogLinks.length < 5) {
					const link = "https://huggingface.co" + $(element).attr('href') || '';
					blogLinks.push(link);
				}
			});

			// Fetch content and summarize each blog
			for (const link of blogLinks) {
				const blogResponse = await axios.get(link);
				const blogHtml = blogResponse.data;
				const $blog = cheerio.load(blogHtml);
				const paragraphs: string[] = [];

				// Extract text from <p> tags
				$blog('p').each((_idx, element) => {
					paragraphs.push($(element).text().trim());
				});

				// Summarize paragraphs
				const summary = paragraphs.join('\n').slice(0,100) + "...";

				blogs.push({
					title: $blog('h1').text().trim(),
					image: "https://huggingface.co" + $blog('img').attr('src') || '',
					link: link,
					summary: summary,
				});
			}

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

// Function to summarize content
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
