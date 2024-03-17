import React from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

type ArticleProps = {
	nom: string
	description: string
	url: string
	date?: Date
}

export default function Article({nom, description, url, date}: ArticleProps) {
	const formattedDate = date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

	return (
		<Card className="px-2 py-2">
			<CardHeader>
				<h3 className="text-lg font-semibold">{nom}</h3>
			</CardHeader>
			<CardContent>
				<p className="text-gray-500">{description}</p>
			</CardContent>
			<CardContent><p className="text-gray-500">Published : {formattedDate}</p></CardContent>
			<CardFooter>
				<Link
					className="text-indigo-600 hover:text-indigo-500 flex items-center"
					href={url}
					target="_blank"
				>
					Lien vers article{" "}
					<small className="pl-2">
						<ArrowRight/>
					</small>
				</Link>
			</CardFooter>
		</Card>
	)
}
