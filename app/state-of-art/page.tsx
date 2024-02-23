import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import ArticleFromHf from "@/components/component/artifcleFromHf";

export default function Home() {
    return (
        <main className="max-w-7xl mx-auto p-5 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center border-b-2 border-gray-200 py-6 md:justify-start gap-2">
                <Button><Link className="text-lg font-semibold" href="/">Retour à la page d'accueil</Link></Button>
            </div>
            <div><ArticleFromHf/></div>
        </main>
    );
};

