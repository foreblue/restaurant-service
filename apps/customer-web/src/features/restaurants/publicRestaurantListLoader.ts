import { getPublicRestaurants } from "./publicRestaurantApi";
import { type PublicRestaurantListItem } from "./publicRestaurantTypes";

export interface PublicRestaurantListPageData {
  restaurantListError: boolean;
  restaurants: PublicRestaurantListItem[];
}

export async function loadPublicRestaurantList(): Promise<PublicRestaurantListPageData> {
  try {
    const list = await getPublicRestaurants();

    return {
      restaurantListError: false,
      restaurants: list.restaurants,
    };
  } catch {
    return {
      restaurantListError: true,
      restaurants: [],
    };
  }
}
