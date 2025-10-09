import { Api } from './service';

// Get shop settings
export const fetchShopSettings = (router) => {
  return Api('get', 'shop-settings', null, router);
};

// Update shop settings
export const updateShopSettings = (settingsData, router) => {
  return Api('put', 'shop-settings', settingsData, router);
};
