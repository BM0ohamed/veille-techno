"use client"
import * as React from "react";
import { useEffect, useState } from "react";
import Article from "@/components/component/article";
import { Blog } from "@/pages/api/service";

type ArtifcleFromHfProps = {}



const ArticleFromHf: React.FC<ArtifcleFromHfProps> = () => {
	const [data, setData] = useState<Blog[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const responseHf = await fetch('/api/HuggingFaceBlogScraper');
				const dataFromHfCache = await responseHf.json();

				// Fetch data from another API
				const responseOpenAi = await fetch('/api/OpenAiBlogScraper');
				const dataFromOpenAICache = await responseOpenAi.json();

				const responseDL = await fetch('/api/deeplearningScraper');
				const dataFromDl = await responseDL.json();

				// Merge or concatenate the data from both APIs
				let mergedData = [...dataFromHfCache, ...dataFromOpenAICache, ...dataFromDl].map(item => {
					const dateStr = item.date;
					let date;
					if (dateStr.includes('Published')) {
						const dateString = dateStr.replace('Published', '').trim();
						date = new Date(dateString);
					} else {
						date = new Date(dateStr);
					}
					return {...item, parsedDate: date};
				});
				mergedData.sort((a, b) => b.parsedDate - a.parsedDate);
				setData(mergedData);
				setIsLoading(false);
			} catch (error) {
				console.error('Error fetching data:', error);
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);


	return (
		<>
			{!isLoading && data.map(blog => (
				<Article
					key={`hf-blog-${blog.title}`}
					nom={`${blog.title.length > 40 ? blog.title.substring(0, 50) + '...' : blog.title}`}
					description={blog.summary || ''}
					url={blog.link}
					date={blog.parsedDate}
				/>

			))}
		</>

	)
}

export default ArticleFromHf