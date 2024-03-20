import { kv } from "@vercel/kv";
import { pipeline } from "@xenova/transformers";

export interface Blog {
	title: string;
	date: string;
	summary: string;
	link: string;
	parsedDate?: Date;
}

export async function readCache(blogKey: string): Promise<Blog[]> {
	try {
		const blogsData = await kv.get<Blog[]>(blogKey);
		if (blogsData && typeof blogsData !== 'string') {
			return blogsData;
		} else if (typeof blogsData === 'string') {
			return JSON.parse(blogsData);
		}
		return [];
	} catch (error) {
		console.error('Error reading cache:', error);
		return [];
	}
}


export async function saveToCache(blogs: Blog[], blogKey: string): Promise<void> {
	try {
		const existingBlogs = await readCache(blogKey);
		const updatedBlogs = [...existingBlogs, ...blogs];
		await kv.set(blogKey, JSON.stringify(updatedBlogs));
		console.log('Cache updated successfully.');
	} catch (error) {
		console.error('Error updating cache:', error);
	}
}

export async function summarize(text: string): Promise<string> {
	try {
		const generator = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6',
			{cache_dir: '/tmp/xenova_cache'});
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
