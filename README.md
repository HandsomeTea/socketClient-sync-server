# socketClient-sync-server
    这是一个基于websocket的操作端和服务端的交互同步服务，支持端与端多对多的关系。
## 连接到服务

- 地址：ws://{host}:3207/sync/server

- 操作端连接与服务端连接的区分：

  - 操作端连接，在连接websocket的`headers`中加入：

    ```js
    {
        'websocket-accept-sign': 'client'
    }
    ```

  - 服务端连接，在连接websocket的`headers`中加入：

    ```js
    {
        'websocket-accept-sign': 'service',
        /* 多个服务器端时，服务器必须带自己的唯一标识信息，其中唯一标识id会做检查 */
        'websocket-accept-sign-id': 'xxxxxxx',
        'websocket-accept-sign-name': 'xxxxxxx'
    }
    ```



## 消息定义



#### 系统消息

指由服务器发出的消息，不包括对操作端和服务端之间的通讯消息的转发。

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

- `id`，可能有，消息的唯一标识，当服务器对操作端和服务端之间的通讯消息进行安全检查时，该字段可能会有。
- `type`，一定有，系统消息只有system一种值。
- `method`，一定有，相当于http api中的接口地址。
- `data`，不一定有，相当于http api中请求成功的结果。
- `errorCode`，不一定有，相当于http api中请求失败的结果，该结果为字符串错误码，不为文字描述。
- `message`，当`errorCode`存在时，必定有，表示系统错误提示的内容描述。





#### 操作端消息

指由操作端发给服务端的消息。一个操作端发送的消息，只有该端能收到回应，类似http。

```js
{
    id: string
    service?: string
    type: 'request'
    method: string
    data: any
}
```

- `id`，必选，服务器会检查，消息的唯一标识。
- `service`，服务器会检查，当多服务端时为必选，表示服务端的唯一标识，用来标明向哪个服务端发送数据。
- `type`，必选，服务器会检查，request表示操作端向服务端请求展示数据或发送擦做指令。
- `method`，必选，服务器会检查，同系统消息中的`method`。
- `data`，服务器会检查，当`type`为order时，必选，表示操作端发出的操作指令期望的操作结果，相当于http api中的请求参数；当`type`为request时，该字段可根据需要选填。



#### 服务端消息

指由服务端发送给操作端的消息。服务端任何交互数据的变化，需要将该变化以notice的方式通知给操作端，操作端除了初始状态值的请求之外，无需通过额外的请求去刷新状态值的变化。

```js
{
    id?: string
    service?: string
    type: 'notice' | 'response'
    method: string
    data: any
    errorCode?: string
    message?: string
}
```

- `id`，服务器会检查，当服务端收到操作端的消息时，操作端的消息会带有一个id，服务端对该消息的回复必须也使用这个id，保证通讯准确；当服务端单方面通知操作端时(`type`为notice)，id字段可以没有。
- `service`，服务器会检查，当为多服务端且`type`为notice时为必选，表示服务端的唯一标识。
- `type`，必选，服务器会检查，notice表示服务端单方面通知操作端状态或数据变化，response表示操作端发出的request消息服务端做出的回复。
- `method`，必选，服务器会检查，同系统消息中的`method`。
- `data`，服务器会检查，相当于http api中请求成功的结果，消息中`data`和`errorCode`必须有一个。
- `errorCode`，服务器会检查，相当于http api中请求失败的结果，该结果为字符串错误码，不为文字描述，且必须由大写字母和下划线组成，消息中`data`和`errorCode`必须有一个。
- `message`，服务器会检查，当`errorCode`存在时，必选，是错误的内容描述。



#### 其他

服务器提供了method`communicationLinkCount`，供操作端和服务端查询可通讯的socket连接数量，操作端得到的是服务端的连接数量，服务端得到的是操作端的连接数量。请求如下：

```js
{
    id: 'xxxxxxx',
    type: 'xxxxx',
    method: 'communicationLinkCount'
}
```

多服务端模式下，服务器提供`serviceList`method，用于获取服务端列表。操作端请求如下：

```js
{
    id: 'xxxxxxx',
    type: 'response',
    method: 'serviceList'
}
```
