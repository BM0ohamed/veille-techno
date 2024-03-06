import { promisify } from "util";
import fs from "fs";
import { pipeline } from "@xenova/transformers";


const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

export interface Blog {
	title: string,
	date: string,
	summary: string,
	link: string,
}

export async function readCache(CSV_FILE_PATH: string): Promise<Blog[]> {
	try {
		const data = await readFileAsync(CSV_FILE_PATH, 'utf8');
		const lines = data.trim().split('\n');
		const cachedBlogs: Blog[] = lines.map(line => {
			const [title, date, summary] = line.split(',').map(field => field.replace(/"/g, ''));
			return {title, date, summary, link: ''}; // Assuming link is not stored in the cache
		});
		return cachedBlogs;
	} catch (error) {
		// If the cache file does not exist or there is a read error, return an empty array
		return [];
	}
}

export async function saveToCache(path: string, blogs: Blog[]): Promise<void> {
	const csvContent = blogs.map(blog => `"${blog.title}","${blog.date}","${blog.summary}"`).join('\n');
	try {
		await writeFileAsync(path, csvContent, 'utf8');
		console.log('Cache updated successfully.');
	} catch (error) {
		console.error('Error updating cache:', error);
	}
}

export async function summarize(text: string): Promise<string> {
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
