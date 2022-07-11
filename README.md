# socketClient-sync-server
    这是一个基于websocket的客户端和服务端的交互同步服务。
## 连接到服务

- 地址：ws://{host}:3207/sync/server

- web端连接与服务端连接的区分：

  - web端连接，在连接websocket的`headers`中加入：

    ```js
    {
        'websocket-accept-sign': 'client'
    }
    ```

  - 服务端连接，在连接websocket的`headers`中加入：

    ```js
    {
        'websocket-accept-sign': 'service'
    }
    ```



## 消息定义



#### 系统消息

指由服务器发出的消息，不包括对web端和服务端之间的通讯消息的转发。

```js
{
    id?: string
    type: 'system'
    method: string
    data: any
    errorCode?: string
    message?: string
}
```

- `id`，可能有，消息的唯一标识，当服务器对web端和服务端之间的通讯消息进行安全检查时，该字段可能会有。
- `type`，一定有，系统消息只有system一种值。
- `method`，一定有，相当于http api中的接口地址。
- `data`，不一定有，相当于http api中请求成功的结果。
- `errorCode`，不一定有，相当于http api中请求失败的结果，该结果为字符串错误码，不为文字描述。
- `message`，当`errorCode`存在时，必定有，表示系统错误提示的内容描述。





#### web端消息

指由web端发给服务端的消息。

```js
{
    id: string
    type: 'request' | 'order'
    method: string
    data: any
}
```

- `id`，必选，服务器会检查，消息的唯一标识，一般为时间戳字符串。
- `type`，必选，服务器会检查，request表示web端向服务端请求一些展示数据或状态数据，order表示web端向服务端发出操作指令，如关闭摄像头等。
- `method`，必选，服务器会检查，同系统消息中的`method`。

- `data`，服务器会检查，当`type`为order时，必选，表示web端发出的操作指令期望的操作结果，相当于http api中的请求参数；当`type`为request时，该字段可根据需要选填。



#### 设备端消息

指由服务端发送给web端的消息。

```js
{
    id?: string
    type: 'notice' | 'order-result' | 'response'
    method: string
    data: any
    errorCode?: string
    message?: string
}
```

- `id`，服务器会检查，当服务端收到web端的消息时，web端的消息会带有一个id，服务端对该消息的回复必须也使用这个id，保证通讯准确；当服务端单方面通知web端时(`type`为notice)，id字段可以没有。
- `type`，必选，服务器会检查，notice表示服务端单方面通知web端状态或数据变化，order-result表示web端发出的order消息服务端做出的回复，response表示web端发出的request消息服务端做出的回复。
- `method`，必选，服务器会检查，同系统消息中的`method`。
- `data`，服务器会检查，相当于http api中请求成功的结果，消息中`data`和`errorCode`必须有一个。
- `errorCode`，服务器会检查，相当于http api中请求失败的结果，该结果为字符串错误码，不为文字描述，且必须由大写字母和下划线组成，消息中`data`和`errorCode`必须有一个。
- `message`，服务器会检查，当`errorCode`存在时，必选，是错误的内容描述。
