import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicRestaurantPageContent } from "@/features/restaurants/PublicRestaurantPageContent";
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
  const restaurant = await loadRestaurantOrNotFound(() => getPublicRestaurantById(restaurantId));
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
