### shopifyPartials
结合业务重写shopify部分代码

### 初衷
shopify很强大，但是大部分主题目前还是使用jq编写，部分主题使用 react/vue/ng 也是编译后的代码，很晦涩难懂。
结合自身的业务场景，主要对shopify产品详情页多属性组合切换以及shopify的地址切换进行了重写

### 使用技术
zepto & vue2.6

### 2021.02.19 更新
checkout 个人信息填写页面，国家数据来源于 shopify

    难点：
        1. 以国家切换为入口，刷新整体的 ui。这里需要提前定义好 ui 布局，详情参见 checkout/checkout-countries.new.js 中的 ADDRESS_FORMAT 对象
        2. 表单项的 label 的上浮动画需要加上 `transform: translateY(2px);` 
