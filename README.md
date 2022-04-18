# ShopifyPartials

## :large_blue_circle: Internationalization

English | [中文文档](README_zh.md)

## :information_source: Introductions

Learn and rewrite parts of Shopify code based on my own business logic

### The original
1. Shopify is powerful, but most of the themes are currently written in JQ, and some of the themes using React/Vue /ng are also compiled code that is hard to understand.
2. Combined with its own business scenarios, this paper mainly rewrites Shopify product detail page multi-attribute combination switch and Shopify address select.

### Technology
zepto & vue2.6

### Shopify Address Component
Shopify address page, country data from Shopify

tips：
1. With the country switch as the entry point, refresh the overall UI. The UI layout needs to be defined in advance, as described in the `ADDRESS_FORMAT` in `/checkout/checkout-countries.new.js`
2. The float animation for the Label of the form item needs to be added `transform: translateY(2px);` 

### Shopify Product Options Select Component
This component is inspired by [sku multi-dimensional attribute state judgment algorithm](https://keelii.com/2016/12/22/sku-multi-dimensional-attributes-state-algorithm/) It is recommended to master all the Knowledge points, otherwise reading the code will be more difficult

## :stuck_out_tongue_winking_eye: Authors

[i7eo](https://i7eo.com/about/)

## :copyright: License

[License MIT](LICENSE)



