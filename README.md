# ShopifyPartials

## :large_blue_circle: Internationalization

English | [中文文档](README_zh.md)

## :information_source: Introductions

Learn and rewrite parts of Shopify code based on my own business logic

### The original
1. Shopify is powerful, but most of the themes are currently written in JQ, and some of the themes using React/Vue /ng are also compiled code that is hard to understand.
2. Combined with its own business scenarios, this paper mainly rewrites Shopify product detail page multi-attribute combination switch and Shopify address switch.

### Technology
zepto & vue2.6

### 2021.02.19 update
Shopify address page, country data from Shopify

tips：
1. With the country switch as the entry point, refresh the overall UI. The UI layout needs to be defined in advance, as described in the `ADDRESS_FORMAT` in `/checkout/checkout-countries.new.js`
2. The float animation for the Label of the form item needs to be added `transform: translateY(2px);` 

## :stuck_out_tongue_winking_eye: Authors

[i7eo](https://i7eo.com/about/)

## :copyright: License

[License MIT](LICENSE)



