import { promisify } from "util";
import fs from "fs";
import { pipeline } from "@xenova/transformers";


const readFileAsync = promisify(fs.readFile);
const appendFileAsync = promisify(fs.appendFile);


export interface Blog {
	title: string,
	date: string,
	summary: string,
	link: string,
	parsedDate?: Date,
}

export async function readCache(path: string): Promise<Blog[]> {
	const data = await readFileAsync(path, 'utf8');
	const rows = data.split('\n').map(row => row.trim()).filter(row => row.length > 0);

	// Map each row to a Blog object by splitting the row into fields using the '|' delimiter.
	const blogs: Blog[] = rows.map(row => {
		const fields = row.split('|').map(field => field.trim().replace(/^"|"$/g, ''));

		// Map the fields to a Blog object.
		const blog: Blog = {
			title: fields[0],
			date: fields[1],
			summary: fields[2],
			link: fields[3]
		};

		return blog;
	});

	return blogs;
}


export async function saveToCache(path: string, blogs: Blog[]): Promise<void> {
	const csvContent = blogs.map(blog => `"${blog.title}"|"${blog.date}"|"${blog.summary}"|"${blog.link}"`).join('\n');
	try {
		await appendFileAsync(path, csvContent, 'utf8');
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
