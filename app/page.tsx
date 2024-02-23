import Article from "@/components/component/article"
import { Button } from "@/components/ui/button"
import React from "react";
import Link from "next/link";
import ArtifcleFromHf from "@/components/component/artifcleFromHf";

export default function Home() {
	return (
		<main className="max-w-7xl mx-auto p-5 sm:px-6 lg:px-8">
			<div className="flex justify-between items-center border-b-2 border-gray-200 py-6 md:justify-start gap-2">
				<Button><Link className="text-lg font-semibold" href="/state-of-art">État de l'art</Link></Button>
				<Button className="text-lg font-semibold">Filtre</Button>
			</div>
			<div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<ArtifcleFromHf/>
			</div>
		</main>
	)
}
