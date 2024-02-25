"use client"
import * as React from "react";
import { useEffect, useState } from "react";
import Article from "@/components/component/article";
import { HfBlog } from "@/pages/api/HuggingFaceBlogScraper";

type ArtifcleFromHfProps = {}


const ArticleFromHf: React.FC<ArtifcleFromHfProps> = () => {
	const [data, setData] = useState<HfBlog[]>([]);
	useEffect(() => {
		fetch('/api/HuggingFaceBlogScraper')
			.then((res) => res.json())
			.then((data) => {
				setData(data)
			})
			.catch((error) => {
				console.error('Error fetching blogs:', error);
			});
	}, []);


	return (
		<>
			{data.map(blog => (
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