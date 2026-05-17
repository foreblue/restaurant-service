import { notFound } from "next/navigation";

import { PublicRestaurantPageContent } from "@/features/restaurants/PublicRestaurantPageContent";
import { getPublicRestaurantById } from "@/features/restaurants/publicRestaurantApi";
import { PublicApiError } from "@/shared/api/apiError";

interface PublicRestaurantByIdPageProps {
  params: Promise<{
    restaurantId: string;
  }>;
}

export default async function PublicRestaurantByIdPage({ params }: PublicRestaurantByIdPageProps) {
  const { restaurantId } = await params;
  const restaurant = await loadRestaurantOrNotFound(() => getPublicRestaurantById(restaurantId));

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
