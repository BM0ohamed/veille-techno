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
				const response1 = await fetch('/api/HuggingFaceBlogScraper');
				const data1 = await response1.json();

				// Fetch data from another API
				const response2 = await fetch('/api/OpenAiBlogScraper');
				const data2 = await response2.json();

				// Merge or concatenate the data from both APIs
				const mergedData = [...data1, ...data2];

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
				/>
			))}
		</>

	)
}

export default ArticleFromHf