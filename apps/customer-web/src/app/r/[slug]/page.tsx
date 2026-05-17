import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicApiError } from "@/shared/api/apiError";
import { PublicRestaurantPageContent } from "@/features/restaurants/PublicRestaurantPageContent";
import {
  createPublicRestaurantMetadata,
  createUnavailableRestaurantMetadata,
} from "@/features/restaurants/publicRestaurantMetadata";
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

export async function generateMetadata({
  params,
}: PublicRestaurantBySlugPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const restaurant = await getPublicRestaurantBySlug(slug);

    return createPublicRestaurantMetadata(restaurant);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      return createUnavailableRestaurantMetadata();
    }

    throw error;
  }
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
