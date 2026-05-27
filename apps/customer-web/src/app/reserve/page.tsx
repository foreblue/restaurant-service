import { ReservationEntryPageContent } from "@/features/reservations/ReservationEntryPageContent";
import { loadPublicRestaurantList } from "@/features/restaurants/publicRestaurantListLoader";

export default async function ReservationEntryPage() {
  const { restaurantListError, restaurants } = await loadPublicRestaurantList();

  return (
    <ReservationEntryPageContent
      restaurantListError={restaurantListError}
      restaurants={restaurants}
    />
  );
}
