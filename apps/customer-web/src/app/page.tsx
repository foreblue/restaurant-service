import { HomePageContent } from "@/components/HomePageContent";
import { loadPublicRestaurantList } from "@/features/restaurants/publicRestaurantListLoader";

export default async function HomePage() {
  const { restaurantListError, restaurants } = await loadPublicRestaurantList();

  return <HomePageContent restaurantListError={restaurantListError} restaurants={restaurants} />;
}
