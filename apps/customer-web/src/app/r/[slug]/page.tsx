import { type Metadata } from "next";

import { PublicApiError } from "@/shared/api/apiError";
import { PublicRestaurantPageContent } from "@/features/restaurants/PublicRestaurantPageContent";
import { UnavailableReservationLinkPage } from "@/features/restaurants/UnavailableReservationLinkPage";
import {
  createPublicRestaurantMetadata,
  createUnavailableRestaurantMetadata,
} from "@/features/restaurants/publicRestaurantMetadata";
import { getPublicRestaurantBySlug } from "@/features/restaurants/publicRestaurantApi";
import { getPublicReservationProducts } from "@/features/reservations/reservationOptionsApi";

interface PublicRestaurantBySlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PublicRestaurantBySlugPage({
  params,
}: PublicRestaurantBySlugPageProps) {
  const { slug } = await params;
  const restaurant = await loadRestaurantOrUnavailable(() => getPublicRestaurantBySlug(slug));

  if (!restaurant) {
    return <UnavailableReservationLinkPage />;
  }

  const productList = await getPublicReservationProducts(restaurant.id);

  return <PublicRestaurantPageContent products={productList.products} restaurant={restaurant} />;
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

async function loadRestaurantOrUnavailable<T>(loader: () => Promise<T>) {
  try {
    return await loader();
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
