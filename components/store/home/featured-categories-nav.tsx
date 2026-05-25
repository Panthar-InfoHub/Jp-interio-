import Link from "next/link";
import { prisma } from "@/prisma/db";

export async function FeaturedCategoriesNav() {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    orderBy: {
      order: "asc",
    },
    take: 7,
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (categories.length === 0) return null;

  return (
    <div className="w-full bg-white border-b border-gray-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-8 md:gap-24 overflow-x-auto whitespace-nowrap no-scrollbar">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="text-xs md:text-sm font-medium tracking-wide text-gray-500 hover:text-black transition-colors duration-200"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
