import { WS_CLIENT_PROVIDER_PREFIX } from './websocket.constants';

export const createProviderToken = (name: string): string => {
  return `${WS_CLIENT_PROVIDER_PREFIX}:${name}`;
};
