import { type Metadata } from "next";

import { PublicRestaurantPageContent } from "@/features/restaurants/PublicRestaurantPageContent";
import { UnavailableReservationLinkPage } from "@/features/restaurants/UnavailableReservationLinkPage";
import {
  createPublicRestaurantMetadata,
  createUnavailableRestaurantMetadata,
} from "@/features/restaurants/publicRestaurantMetadata";
import { getPublicRestaurantById } from "@/features/restaurants/publicRestaurantApi";
import { getPublicReservationProducts } from "@/features/reservations/reservationOptionsApi";
import { PublicApiError } from "@/shared/api/apiError";

interface PublicRestaurantByIdPageProps {
  params: Promise<{
    restaurantId: string;
  }>;
}

export default async function PublicRestaurantByIdPage({ params }: PublicRestaurantByIdPageProps) {
  const { restaurantId } = await params;
  const restaurant = await loadRestaurantOrUnavailable(() => getPublicRestaurantById(restaurantId));

  if (!restaurant) {
    return <UnavailableReservationLinkPage />;
  }

  const productList = await getPublicReservationProducts(restaurant.id);

  return <PublicRestaurantPageContent products={productList.products} restaurant={restaurant} />;
}

export async function generateMetadata({
  params,
}: PublicRestaurantByIdPageProps): Promise<Metadata> {
  const { restaurantId } = await params;

  try {
    const restaurant = await getPublicRestaurantById(restaurantId);

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
