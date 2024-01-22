import Article from "@/components/component/article"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto p-5 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center border-b-2 border-gray-200 py-6 md:justify-start gap-2">
        <Button className="text-lg font-semibold">État de l'art</Button>
        <Button className="text-lg font-semibold">Filtre</Button>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => {
          return (
            <Article
              key={`article-${i}`}
              nom={"Nom de l'article"}
              description={`Lorem ipsum dolor sit amet consectetur adipisicing numquam rerum illo qui! Earum?`}
              url={"#"}
            />
          )
        })}
      </div>
    </main>
  )
}
