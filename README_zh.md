# ShopifyPartials

## :large_blue_circle: 国际化

[English](README.md) | 中文文档

## :information_source: 项目介绍

结合自己的业务逻辑学习并重写shopify部分代码

### 初衷
1. shopify很强大，但是大部分主题目前还是使用jq编写，部分主题使用 react/vue/ng 也是编译后的代码，很晦涩难懂。
2. 结合自身的业务场景，主要对shopify产品详情页多属性组合切换以及shopify的地址切换进行了重写。

### 使用技术
zepto & vue2.6

### Shopify Address Component
shopify地址页面，国家数据来源于 shopify。主要用vue重写了地址联动

难点：
1. 以国家切换为入口，刷新整体的 ui。这里需要提前定义好 ui 布局，详情参见 checkout/checkout-countries.new.js 中的 ADDRESS_FORMAT 对象
2. 表单项的 label 的上浮动画需要加上 `transform: translateY(2px);`

### Shopify Product Options Select Component
本组件灵感来源于 [sku 多维属性状态判断算法](https://keelii.com/2016/12/22/sku-multi-dimensional-attributes-state-algorithm/) 建议先掌握这个篇文章中的所有知识点否则阅读代码会比较吃力

## :stuck_out_tongue_winking_eye: 关于作者

[i7eo](https://i7eo.com/about/)

## :copyright: 版权信息

[License MIT](LICENSE)


