# Jike Bus 🚍

Jike Bus 🚍 是即刻镇的公交专线，有卡刷卡，投币一元。

## Quick Start

```javascript
const jike = require('./jike')

;(async () => {
    let c = await jike.JikeClient(refreshToken)
    let myProfile = await c.getMyProfile()
})
```

> 返回类型均为 Promise

## Usage

还未实现扫码登录部分，初始化客户端要求传入 `x-jike-refresh-token`

支持的接口请参考 [Sorosliu1029/Jike-Metro](https://github.com/Sorosliu1029/Jike-Metro) 的 [API 文档](https://www.0x2beace.me/Jike-Metro/)

基本上把 Python 的下划线方法名改成驼峰命名再加上 `await` 就可以了 (部分方法名有所修改)

分页信息流 `loadMore()`，`loadAll()` 与 Jike-Metro 功能一致 

只是 Web API 请求的简单封装，比较丑陋，不关心返回字段改动 (不固定字段，全看官方心情)

**目前为止还是 0 dependency，之后不得不用库**

## Feature

- 获取自己的收藏，查看自己的用户信息
- 流式获取首页消息和动态
- 获取某个用户的用户信息、发布的动态、创建的主题、关注的主题、TA 关注的人和关注 TA 的人
- 获取某条消息 / 动态 / 评论的评论 / 回复
- 获取某个主题下的精选和广场
- 发布个人动态 (可带图、带链接、带主题)，删除个人动态
- 点赞、收藏、评论 / 删除评论、转发某条消息 / 动态
- 在浏览器中打开某条消息的原始链接
- 根据关键词搜索主题
- 根据关键词搜索自己的收藏
- 获取即刻首页的推荐关注主题列表（不限于首页显示的5个）

>  即 Jike-Metro [README](https://github.com/Sorosliu1029/Jike-Metro#jike-metro--乘车体验) 中提到的所有 feature

## Todo

- [ ] 扫码登录 ([alexeyten/qr-image](https://github.com/alexeyten/qr-image))
- [ ] 消息通知 ([websockets/ws](https://github.com/websockets/ws) + EventEmitter)
- [ ] 新动态提醒 (setTimeout 轮询 + EventEmitter)

## Reference

- [Sorosliu1029/Jike-Metro](https://github.com/Sorosliu1029/Jike-Metro)

## License

MIT