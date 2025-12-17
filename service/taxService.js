import { Api } from './service';

// Get tax settings
export const fetchTaxSettings = (router) => {
  return Api('get', 'tax', null, router);
};

// Update tax settings
export const updateTaxSettings = (taxData, router) => {
  return Api('put', 'tax', taxData, router);
};
