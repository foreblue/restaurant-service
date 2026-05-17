import { notFound } from "next/navigation";

import { PublicApiError } from "@/shared/api/apiError";
import { PublicRestaurantPageContent } from "@/features/restaurants/PublicRestaurantPageContent";
import { getPublicRestaurantBySlug } from "@/features/restaurants/publicRestaurantApi";

interface PublicRestaurantBySlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PublicRestaurantBySlugPage({
  params,
}: PublicRestaurantBySlugPageProps) {
  const { slug } = await params;
  const restaurant = await loadRestaurantOrNotFound(() => getPublicRestaurantBySlug(slug));

  return <PublicRestaurantPageContent restaurant={restaurant} />;
}

async function loadRestaurantOrNotFound<T>(loader: () => Promise<T>) {
  try {
    return await loader();
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
