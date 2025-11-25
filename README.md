# LiuDashuai Element Plus

更新日志

- 1.1.3 日期月份选择组件 UI 调整 select 组件 UI+交互调整
- 1.1.2 dialog headerUI 调整
- 1.1.1 级联选择器下拉 UI 调整
- 1.1.0 select 定制化调整
- 1.0.8 更改选择框 suffix
- 1.0.7 修复全选无法触发 change 事件
- 1.0.6 精简代码, 性能优化
- 1.0.4 无用代码删除, 子节点删除操作使用数组
- 1.0.3 addNodeByValue 进行调整 改用传入数组的入参
- 1.0.2 添加了 addNodeByValue 和 removeNodeByValue 方法 用于外部组件操作

这是一个基于 [Element Plus](https://element-plus.org/) 的定制化 Vue 3 组件库。

## 主要修改

- **级联选择器优化**: 对 `cascader-panel` 组件进行了性能优化，包括：
  - 添加了全选功能
  - 添加了 addNodeByValue removeNodeByValue 方法 可以直接操作组件 增加选择节点和删除节点

## 安装

```bash
npm install liudashuai-element-plus
# 或
yarn add liudashuai-element-plus
# 或
pnpm add liudashuai-element-plus
```

## 使用

```javascript
import { createApp } from 'vue'
import LiuDashuaiElementPlus from 'liudashuai-element-plus'
import 'liudashuai-element-plus/dist/index.css'

const app = createApp(App)
app.use(LiuDashuaiElementPlus)
app.mount('#app')
```

## 许可证

MIT License - 基于 Element Plus 的 MIT 许可证

## 致谢

感谢 [Element Plus](https://github.com/element-plus/element-plus) 团队提供的优秀组件库。

<p align="center">
  <img width="300px" src="https://user-images.githubusercontent.com/10731096/95823103-9ce15780-0d5f-11eb-8010-1bd1b5910d4f.png">
</p>

<p align="center">
  <a href="https://www.npmjs.org/package/element-plus">
    <img src="https://img.shields.io/npm/v/element-plus.svg" />
  </a>
  <a href="https://github.com/element-plus/element-plus">
    <img src="https://img.shields.io/badge/node-%20%3E%3D%2020-47c219" />
  </a>
  <a href="https://npmcharts.com/compare/element-plus?minimal=true">
    <img src="https://img.shields.io/npm/dm/element-plus.svg" />
  </a>
  <a href="https://codecov.io/gh/element-plus/element-plus">
    <img src="https://codecov.io/gh/element-plus/element-plus/branch/dev/graph/badge.svg?token=BKSBO2GLZI"/>
  </a>
  <br>
</p>

<p align="center">Element Plus - A Vue.js 3 UI library</p>

- 💪 Vue 3 Composition API
- 🔥 Written in TypeScript

## Getting Started

Alright, for you to get started if you are looking for making Element Plus better you should keep reading.
For developers that uses Element Plus to develop your website you should go ahead visit [Getting Started](https://element-plus.org/).

- 中国大陆[加速镜像站点](https://cn.element-plus.org/zh-CN/)

## Breaking change list

The first stable release of Element Plus suitable for use in production was released on February 07, 2022. The APIs is stable right now, and here's also a full list about how to get upgraded from [Element UI](https://element.eleme.io) to Element Plus.

You can find the breaking change list here: [Breaking Change List](https://github.com/element-plus/element-plus/discussions/5658).

### Migration Tool :hammer_and_wrench:

We have made a migration tool for you to migrate your project from [Element UI](https://element.eleme.io) to Element Plus.

You can find the [gogo code migration tool](https://github.com/thx/gogocode/tree/main/packages/gogocode-plugin-element) here.

We have tested this on [Vue Element Admin](https://github.com/PanJiaChen/vue-element-admin). You can find the transpiled code [here](https://github.com/gogocodeio/vue-element-admin).

### Playground

You can also try Element Plus out with the components built-in playground.

#### Try it with our built-in playground

[Playground](https://element-plus.run/)

#### Try it with code sandbox

[![Edit element-plus](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/element-plus-demo-dxtcr)

<p align="center">
  <b>Special thanks to the generous sponsorship by:</b>
</p>
<br/>
<p align="center">
  <b>Platinum Sponsors</b>
</p>
<table align="center" cellspacing="0" cellpadding="0">
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://melecode.com/" target="_blank">
          <img width="150px" src="https://github.com/element-plus/element-plus/assets/82012629/9ca4269c-7545-4463-9bdc-8e5a1fbd0b08">
        </a>
      </td>
      <td align="center" valign="middle">
        <a href="https://www.jnpfsoft.com/index.html?from=elementUI" target="_blank">
          <img width="150px" src="https://github.com/element-plus/element-plus/assets/17680888/6a044d82-c393-48ab-90b8-de0d3aad1624">
        </a>
      </td>
      <td align="center" valign="middle">
        <a href="https://vue.misboot.com/#/login?from=element-plus" target="_blank">
          <img width="150px" src="https://github.com/user-attachments/assets/ade8e7e6-f9a4-45d5-9006-44b548599a8d">
        </a>
      </td>
      <td align="center" valign="middle">
        <a href="http://github.crmeb.net/u/Element?from=element-plus" target="_blank">
          <img width="150px" src="https://github.com/user-attachments/assets/18079452-986c-4c6e-84ec-fb6175c26567">
        </a>
      </td>
    </tr>
    </tbody>
</table>
<p align="center">
  <b>Gold Sponsors</b>
</p>
<table align="center" cellspacing="0" cellpadding="0">
  <tbody>
    <tr>
      <td align="center" valign="middle">
        <a href="https://doc.buildadmin.com/?from=element-plus" target="_blank">
          <img width="130px" src="https://user-images.githubusercontent.com/17680888/173179536-30e35fd1-cd5a-482a-bc41-9d5f0aa66fd4.png">
        </a>
      </td>
      <td align="center" valign="middle">
        <a href="https://fantastic-admin.github.io/?from=element-plus" target="_blank">
          <img width="130px" src="https://github.com/user-attachments/assets/0dbd9c02-d132-4c9e-a162-2b5a8728fc7e">
        </a>
      </td>
      <td align="center" valign="middle">
        <a href="https://bit.dev/?from=element-ui" target="_blank">
          <img width="130px" src="https://user-images.githubusercontent.com/10095631/41342907-e44e7196-6f2f-11e8-92f2-47702dc8f059.png">
        </a>
      </td>
    </tr>
  </tbody>
</table>

---

## Translations

Element Plus is translated to multiple languages, you can click the badge to help up update the translation or apply to become
a proofreader [![Crowdin](https://badges.crowdin.net/element-plus/localized.svg)](https://crowdin.com/project/element-plus)

For now we are only showing English and Chinese for resource reasons, but we are looking forward to translate it into more languages, please go to the link
above and leave a message if you want to help translating Element Plus into your desired language.

### How to help translating

See how to help translating in [Translating Element Plus](https://element-plus.org/en-US/guide/translation.html).

## Stay tuned :eyes:

Join our [Discord](https://discord.com/invite/gXK9XNzW3X) to start communicating with everybody.

## This thing is broken, I should help improve it!

Awesommmmmmee. Everything you need is down below. You can also refer to
[CONTRIBUTING](https://github.com/element-plus/element-plus/blob/dev/CONTRIBUTING.md) and
[Code of Conduct](https://github.com/element-plus/element-plus/blob/dev/CODE_OF_CONDUCT.md)
where you'll find the same information listed below.

## I would like to become a part of the development team!

Welcome :star_struck:! We are looking for talented developers to join us and making Element Plus better! If you care to join the development team, please
reach out to us, you are more than welcomed to join us! :heart:

We are now lacking of experts of `Testing`, `GitHub Actions`, `PM`, if you do feel like you can and willing to help us, please do reach out to us. :pray:

## Contributors

This project exists thanks to all the people who contribute.

And thank you to all our backers! 🙏

<a href="https://openomy.app/github/element-plus/element-plus" target="_blank" style="display: block; width: 100%;" align="center">
  <img src="https://openomy.app/svg?repo=element-plus/element-plus&chart=bubble&latestMonth=3" target="_blank" alt="Contribution Leaderboard" style="display: block; width: 100%;" />
</a>

<hr />

<a href="https://github.com/element-plus/element-plus/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=element-plus/element-plus" />
</a>

## License

Element Plus is open source software licensed as
[MIT](https://github.com/element-plus/element-plus/blob/master/LICENSE).
