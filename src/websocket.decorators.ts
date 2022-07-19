import { SetMetadata } from '@nestjs/common';

import { WS_CONNECTION_NAME, WS_CLIENT_INSTANCE_PROPERTY, WS_MESSAGE_HANDLER_KEY } from './websocket.constants';

type ClientHandlerOptions = {
  name: string;
};

export const WebSocketClientHandler =
  ({ name }: ClientHandlerOptions) =>
  (target: any) =>
    Reflect.defineMetadata(WS_CONNECTION_NAME, name, target);

export const WebSocketClient = () => (target: any, propertyName: string) =>
  Reflect.defineMetadata(WS_CLIENT_INSTANCE_PROPERTY, propertyName, target);

export const MessageHandler = (messageName: string) => SetMetadata(WS_MESSAGE_HANDLER_KEY, { event: messageName });

export const OnError = () => SetMetadata(WS_MESSAGE_HANDLER_KEY, { event: 'error' });

export const OnOpen = () => SetMetadata(WS_MESSAGE_HANDLER_KEY, { event: 'open' });
