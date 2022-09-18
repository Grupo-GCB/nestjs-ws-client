import { DynamicModule, Logger, Module, OnApplicationShutdown, OnModuleInit, Scope } from '@nestjs/common';
import { MetadataScanner, ModuleRef, ModulesContainer, Reflector } from '@nestjs/core';
import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import { ClientOptions, WebSocket } from 'ws';

import {
  WS_CLIENT_INSTANCE_PROPERTY,
  WS_CLIENT_PROVIDER_TOKEN,
  WS_CONNECTION_NAME,
  WS_MESSAGE_HANDLER_KEY,
} from './websocket.constants';

import { createProviderToken } from './websocket.utils';
import { buildWebSocketWithReconnection } from './build-websocket-with-reconnection';

export interface WebSocketEventMetadata {
  event: string;
}

type Options = {
  name: string;
  url: string;
  reconnectAfter?: number;
} & ClientOptions;

@Module({
  imports: [DiscoveryModule],
  providers: [MetadataScanner, ModulesContainer],
})
export class SocketModule implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger('Socket Module');

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly module: ModuleRef,
  ) {}

  static register({ url, name, reconnectAfter, ...options }: Options): DynamicModule {
    const providerToken = createProviderToken(name);

    return {
      module: SocketModule,
      providers: [
        {
          provide: providerToken,
          useFactory: () => {
            if (!reconnectAfter) return new WebSocket(url, options);
            return buildWebSocketWithReconnection(url, options, reconnectAfter)
          },
          scope: Scope.TRANSIENT,
        },
        {
          provide: WS_CLIENT_PROVIDER_TOKEN,
          useValue: providerToken,
        },
      ],
      exports: [providerToken, WS_CLIENT_PROVIDER_TOKEN],
    };
  }

  async onModuleInit() {
    const wsProviderToken = this.module.get(WS_CLIENT_PROVIDER_TOKEN);
    const wsProvider = await this.module.resolve(wsProviderToken);
    const connectionName = wsProviderToken.split(':').pop();

    const handlers = await this.discoveryService.providersWithMetaAtKey(WS_CONNECTION_NAME);
    const thisConnectionHandlers = handlers.filter(({ meta }) => meta === connectionName);

    if (!thisConnectionHandlers.length) {
      this.logger.warn('Error finding the WebSocket connection to bind the event handlers!');
      return;
    }

    for (const handler of thisConnectionHandlers) {
      const { instance } = handler.discoveredClass;

      this.listenToClientEvents(instance, wsProvider, connectionName);
      this.decorateWebSocketClientProperty(instance, wsProvider);
    }
  }

  async onApplicationShutdown() {
    const wsProviderToken = this.module.get(WS_CLIENT_PROVIDER_TOKEN);
    const wsProvider = await this.module.resolve(wsProviderToken);

    if (wsProvider && wsProvider.readyState === WebSocket.OPEN) {
      wsProvider.removeAllListeners();
      wsProvider.terminate();
    }
  }

  private decorateWebSocketClientProperty(instance: object, ws: WebSocket) {
    if (instance) {
      const prototype = Object.getPrototypeOf(instance);
      const property = Reflect.getMetadata(WS_CLIENT_INSTANCE_PROPERTY, prototype);

      if (property) {
        instance[property] = ws;
      }
    }
  }

  private async listenToClientEvents(instance: object, ws: WebSocket, connectionName: string): Promise<void> {
    if (instance) {
      const prototype = Object.getPrototypeOf(instance);

      this.metadataScanner.scanFromPrototype(instance, prototype, (methodKey: string) => {
        const callback = instance[methodKey];
        const methodMetadata = this.reflector.get<WebSocketEventMetadata>(WS_MESSAGE_HANDLER_KEY, callback);

        if (methodMetadata) {
          this.logger.verbose(
            `Registering event '${methodMetadata.event}' on ${connectionName.toUpperCase()} socket client...`,
          );
          ws.on(methodMetadata.event, (...args: unknown[]) => {
            callback.call(instance, ...args);
          });
        }
      });
    }
  }
}
