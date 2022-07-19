<p align="center">
  <img src="https://gcbinvestimentos.com/_next/image?url=%2Fassets%2Fillustrations%2Flogo_gcb_color.svg&w=256&q=75" width="120" alt="SSM Logo" />
  <a href="https://github.com/@grupo-gcb/gcb-kafka-connector" target="blank">
    <h4 align="center">@grupo-gcb/nestjs-ws-client</h4>
  </a>
</p>

## Description

This library was build to provide one or multiple WebSocket connection to NestJs Applications.

## Installation

```sh
$ yarn add @grupo-gcb/nestjs-ws-client
```

## Usage

#### Module
```typescript
import { SocketModule } from '@grupo-gcb/nestjs-ws-client';

@Module({
  imports: [
    ...
    SocketModule.register({
      name: 'my-connection',
      url: 'wss://stream.binance.com:9443/ws'
    })
  ]
})
export class AppModule {}
```

#### Service
```typescript
import { MessageHandler, OnError, OnOpen, WebSocketClient, WebSocketClientHandler } from '@grupo-gcb/nestjs-ws-client';
import { WebSocket } from 'ws';

// The name of the registered connection on module
@WebSocketClientHandler({ name: 'my-connection' })
export class SocketHandler {
  
  @WebSocketClient()
  private readonly wsClient: WebSocket; // ws client instance

  @OnOpen()
  handleOpen() {}

  @OnError()
  handleError(err: Error) {
    console.log(err);
  }

  @MessageHandler('message')
  handleMessageEvent(event: Buffer) {
    const data = event.toString();
    console.log({ data });
  }
}

```


##### Authors
- [@thunderjr](https://www.github.com/thunderjr)