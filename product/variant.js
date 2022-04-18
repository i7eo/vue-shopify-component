/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const { flattened, getQueryString, updateHistoryState, print } = window.WHSITE['UTILS']

const useConsole = (data) => {
  print('Info', 'variant.js', data)
}
const hasValue = anyValue => !!anyValue

//  isSafe isSafeWithDefaultSelected getIsSoldOut 当作 prop 传进来

/**
 * ======================================================================================================================================================
 * 使用说明：
 * optionKey:                               指的是 'color' || 'size'
 * optionValue:                             指的是 'color' || 'size' 对应的值比如 'color': 'red'/'blue'
 * ======================================================================================================================================================
 * 概念说明：
 * 这里的 variant（变体）和 sku 是一个概念
 * 安全的 variant 指的是符合业务逻辑能显示的 variant（排除掉一些因为业务逻辑不能显示的 variant）
 * ======================================================================================================================================================
 * 特殊说明：
 * 为了兼容标品，和后端商量后专门在标品的variants中加入了一项变体，但其实这一项是不应该存在的
 * 标品的 product.options.length 为 0，其他商品正常
 * ======================================================================================================================================================
 */

/**
 * 初始化 Variant 需要的数据
 * @param {*} product
 */
function initVariantData (product) {
  /**
   * 变量说明
   * ======================================================================================================================================================
   * 静态变量:
   * ALL_CHOOSED:                           所有属性都选中（选中状态判断）
   * NO_CHOOSED:                            所有属性都未选中（选中状态判断）
   * SOMEONE_CHOOSED:                       有某一项属性被选中（选中状态判断）
   * SEPARATOR:                             变体分隔符
   * SKU_URL_PARAMETER:                     切换sku后url上的sku标识符
   * PRODUCT:                               当前商品（spu）数据，其中包含所有sku（变体）、商品图片、价格等
   * OPTIONS:                               商品数据中存储的optionKey，例如：['color', 'size']
   * VARIANTS:                              商品中所有sku（变体）数据
   * IS_STANDARD_PRODUCT:                   是否为标品，即无任何sku（变体）
   * OPTION_VALUE_NO_TRANSLATE_LIST:        optionValue 中不允许被谷歌翻译的字段，例如：xxxs。。。
   * ======================================================================================================================================================
   * 程序定义变量：
   * optionCollection:                      变体属性简写集合
   * optionValueMap:                        Object, 存放：key 为 color/size, value 为 [{id:0, value: 'red'}, ...] 即 optionValueId（把每一项的索引(索引 + 1)当作当前 optionValue 的 id）避免属性名重复的问题
   * optionValueIds:                        所有的 optionValue id
   * enhancedOptionCollection:              [模版渲染使用] 附带属性（vaild等）的变体属性简写集合
   * vaildOptionCollection:                 [数据处理使用] 有效的变体属性简写集合
   * realVaildOptionCollection:             [数据处理使用] 真正有效的变体属性简写集合
   * SKUResult:                             [选中/反选使用] 根据 realVaildOptionCollection 生成真正有效的包含每条变体信息的 sku 集合
   * ======================================================================================================================================================
   */
  const ALL_CHOOSED = 'ALLCHOOSED'
  const NO_CHOOSED = 'NOCHOOSED'
  const SOMEONE_CHOOSED = 'SOMEONECHOOSED'
  const SEPARATOR = '-'
  const SKU_URL_PARAMETER = 'variant'
  const PRODUCT = product
  const OPTIONS = PRODUCT.options || []
  const VARIANTS = PRODUCT.variants
  const IS_STANDARD_PRODUCT = OPTIONS.length === 0 // cc说可以这么判断
  const OPTION_VALUE_NO_TRANSLATE_LIST = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '2xl', 'xxxl', '3xl']

  const Utils = {
    'createSKUResult': (options, separator) => {
      // 创建所有属性的幂集并把每一条 sku 需要使用的数据写入（比如：价格等）
      const SKUResult = {}

      const getObjKeys = (obj) => {
        // 获得对象的key
        if (obj !== Object(obj)) throw new TypeError('Invalid object')
        const keys = []
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) keys[keys.length] = key
        }
        return keys
      }

      const arrayCombine = (targetArr) => {
        // 从数组中生成指定长度的组合
        if (!targetArr || !targetArr.length) {
          return []
        }

        const len = targetArr.length
        const resultArrs = []

        // 所有组合
        for (let n = 1; n < len; n++) {
          const flagArrs = getFlagArrs(len, n)
          while (flagArrs.length) {
            const flagArr = flagArrs.shift()
            const combArr = []
            for (let i = 0; i < len; i++) {
              flagArr[i] && combArr.push(targetArr[i])
            }
            resultArrs.push(combArr)
          }
        }

        return resultArrs
      }

      const getFlagArrs = (m, n) => {
        // 获得从m中取n的所有组合
        if (!n || n < 1) {
          return []
        }

        const resultArrs = []
        const flagArr = []
        let isEnd = false
        let i
        let j
        let leftCnt

        for (i = 0; i < m; i++) {
          flagArr[i] = i < n ? 1 : 0
        }

        resultArrs.push(flagArr.concat())

        while (!isEnd) {
          leftCnt = 0
          for (i = 0; i < m - 1; i++) {
            if (flagArr[i] === 1 && flagArr[i + 1] === 0) {
              for (j = 0; j < i; j++) {
                flagArr[j] = j < leftCnt ? 1 : 0
              }
              flagArr[i] = 0
              flagArr[i + 1] = 1
              const aTmp = flagArr.concat()
              resultArrs.push(aTmp)
              if (aTmp.slice(-n).join('').indexOf('0') === -1) {
                isEnd = true
              }
              break
            }
            flagArr[i] === 1 && leftCnt++
          }
        }
        return resultArrs
      }

      const setSkuInfo = (key, sku) => {
        if (SKUResult[key]) {
          SKUResult[key].ids.push(sku.id)
          // SKUResult[key].prices.push(sku.ccyPrice)
          // SKUResult[key].mediaIds.push(sku.featuredImage.id)
          // SKUResult[key].linePrices.push(sku.ccyCompareAtPrice)
          // SKUResult[key].count += sku.count4
        } else {
          SKUResult[key] = {
            ids: [sku.id]
            // prices: [sku.ccyPrice],
            // mediaIds: [sku.featuredImage.id],
            // linePrices: [sku.ccyCompareAtPrice]
            // count: sku.count,
          }
        }
      }

      const add2SKUResult = (combArrItem, sku) => {
        // 这个函数是给幂集的组合存值： 1-4-7 的组合，这里会给 [1] [4] [7] [1-4] [1-7] [4-7] 存值 而[1-4-7] 存的值在initSKU中存
        // 把组合的key放入结果集SKUResult
        const key = combArrItem.join(separator)
        // SKU信息key属性
        setSkuInfo(key, sku)
        setSkuInfo(0, sku) // 当前如果没有属性的话显示的价格应该是所有幂集的价格数组范围，所有为了兼容这种情况需要放入 key:0 的一个子集
      }

      const initSKU = () => {
        let i
        let j
        const data = options
        const skuKeys = getObjKeys(data)
        for (i = 0; i < skuKeys.length; i++) {
          const skuKey = skuKeys[i]// 一条SKU信息key
          const sku = data[skuKey]	// 一条SKU信息value
          const skuKeyAttrs = skuKey.split(separator) // SKU信息key属性值数组
          // 对每个SKU信息key属性值进行拆分组合
          const combArr = arrayCombine(skuKeyAttrs)
          for (j = 0; j < combArr.length; j++) {
            add2SKUResult(combArr[j], sku)
          }
          // 结果集接放入SKUResult
          setSkuInfo(skuKey, sku)
          setSkuInfo(0, sku) // 当前如果没有属性的话显示的价格应该是所有幂集的价格数组范围，所有为了兼容这种情况需要放入 key:0 的一个子集
        }
      }

      initSKU()
      return SKUResult
    },
    'optionSelectedState': (active) => {
      // choosedOption: 选中的属性名/值，若都没有选中返回空数组
      // choosedStatus: 当前sku的状态
      const choosedOption = []
      let choosedStatus = NO_CHOOSED
      Object.keys(active).map(optionKey => {
        if (active[optionKey]) {
          choosedOption.push({
            optionKey,
            optionValue: active[optionKey]
          })
        }
      })
      if (choosedOption.length === Object.keys(active).length) {
        choosedStatus = ALL_CHOOSED
      } else {
        if (choosedOption.length === 0) {
          choosedStatus = NO_CHOOSED
        } else {
          choosedStatus = SOMEONE_CHOOSED
        }
      }
      return [choosedOption, choosedStatus]
    },
    'transform2PositiveSequence': (arr) => {
      // 把倒序组合转为正序，因为 SKUResult 中存放的都是正序id，但是选中/反选选择的顺序不同可能会出现倒序的情况，通过该方法把id转为正序在匹配
      return arr.sort((value1, value2) => parseInt(value1) - parseInt(value2))
    },
    'getSiblingSelectedIds': (id, enhancedOptionCollection, active) => {
      // 找到当前层级（规格）中选中的属性id
      let currentOptionKey = ''
      const siblingSelectedIds = []
      for (const [optionKey, optionValue] of enhancedOptionCollection) {
        const isSibling = optionValue.find(option => option.id === id)
        // 找到未被选中的属性所在层级
        if (isSibling) currentOptionKey = optionKey
      }
      // 从active中找到当前层级选中的属性id
      if (active[currentOptionKey]) siblingSelectedIds.push(active[currentOptionKey])

      return siblingSelectedIds
    },
    'isSafe': (variant) => {
      // 判断是否需要置灰
      return !(variant.inventory === 0 && variant.tracked === 0) && variant.available === 1
    },
    'isRemove': (variant) => {
      // 判断是否是被下架了
      return variant.available === 1
    },
    'isSafeWithDefaultSelected': (variant) => {
      // 判断是否需要置灰 且被默认选中
      return !(variant.inventory === 0 && variant.tracked === 0) && variant.available === 1 && variant.isDefault === 1
    }
  }

  const IS_SOLD_OUT = getIsSoldOut(VARIANTS)
  /**
   * 判断当前商品是否售罄
   * @param {*} variants
   */
  function getIsSoldOut (variants) {
    const isUnSafe = (variant) => !Utils.isSafe(variant)
    return variants.filter(isUnSafe).length === variants.length
  }

  const IS_REMOVED = getIsRemoved(VARIANTS)
  /**
   * 判断当前商品是否都被下架
   * @param {*} variants
   */
  function getIsRemoved (variants) {
    const isUnRemove = (variant) => !Utils.isRemove(variant)
    return variants.filter(isUnRemove).length === variants.length
  }

  const optionCollection = getOptionCollection(OPTIONS, VARIANTS)
  /**
   * 通过 OPTIONS VARIANTS 对 VARIANTS 进行转换
   * @param {*} options
   * @param {*} variants
   *
   * 转换后的格式如下：（下面的数据结构称为变体属性简写集合：optionCollection）
   * {
   *    color: ['grey', 'red'],
   *    sizes: ['s', 'm']
   * }
   *
   * 需要注意，在进行转换前一定要确保sku（变体）数据是完整的，这个数据由后端控制返回，前端这里只做简单判断
   * cc说能导入的商品，规格都是全的，所以这里直接取
   */
  function getOptionCollection (options, variants) {
    // 对 options 长度不做判断，标品此项长度为0
    const optionCollection = new Map()
    if (variants.length) {
      // 为了保证得到的结果是按照 options 中 optionKey 排列，这里使用 map 而不使用 object
      return variants.reduce((result, variant) => {
        options.map((optionKey, idx) => {
          if (!result.get(optionKey)) result.set(optionKey, [])
          const key = `option${idx + 1}`
          // 过滤掉重复的 optionKey
          if (!result.get(optionKey).some(item => item === variant[key])) result.get(optionKey).push(variant[key])
        })
        return result
      }, optionCollection)
    } else {
      useConsole(`[getOptionCollection]: variants has some error`)
      return optionCollection
    }
  }

  const optionValueMap = getOptionValueMap(optionCollection)
  /**
   * 得到如下数据：
   * {
   *  color: [
   *    { id: 1， value: 'red' },
   *    { id: 2， value: 'blue' }
   *  ],
   *  size: [
   *    { id: 3， value: 'red' },
   *    { id: 4,  value : 's'}
   *  ]
   * }
   * 存这样的结构是为了解决规格名重复的问题，也可以存为 map 但是查询效率太低
   * 方便查询规格对应的id，在判断置灰时会用到
   * @param {*} optionCollection
   */
  function getOptionValueMap (optionCollection) {
    const optionValueMap = {}
    let idx = 0
    if (optionCollection.size) {
      for (const [key, value] of optionCollection) {
        optionValueMap[key] = value.reduce((result, cur) => {
          idx++
          result.push({ id: idx, value: cur })
          return result
        }, [])
      }
    }
    return optionValueMap
  }

  const optionValueIds = getOptionValueIds(optionValueMap)
  /**
   * 通过 optionValueMap 获得 optionValue 的 id map，在做置灰判断时需要循环该 map，与除自身外的元素做组合去 SKUResult 中查看是否有值，没有值就置灰。
   * @param {*} optionValueMap
   */
  function getOptionValueIds (optionValueMap) {
    let optionValueIds = []
    const optionInfos = Object.keys(optionValueMap)
    // 标品此项长度为0
    if (optionInfos.length) {
      optionValueIds = optionInfos.reduce((result, cur) => {
        const ids = optionValueMap[cur] ? optionValueMap[cur].map(v => v.id) : []
        result.push(...ids)
        return result
      }, [])
    }
    return optionValueIds
  }

  const enhancedOptionCollection = getEnhancedOptionCollection(OPTIONS, VARIANTS, optionValueMap)
  /**
   * 获得附带属性的 enhancedOptionCollection, 与 optionCollection 相比其中多了 vaild、id 等控制选中与反选的属性
   * enhancedOptionCollection 用于模版渲染
   * 数据结构如下：
   * {
   *    color: [{ value: 'grey', vaild: true, id: 1 }, { value: 'red', vaild: true, id: 2 }],
   *    sieze: [{ value: 's', vaild: true, id: 3 }, { value: 'm', vaild: true, id: 4 }]
   * }
   * @param {*} options
   * @param {*} variants
   * @param {*} optionValueMap
   */
  function getEnhancedOptionCollection (options, variants, optionValueMap) {
    // 对 options 长度不做判断，标品此项长度为0
    const enhancedOptionCollection = new Map()
    const optionInfos = Object.keys(optionValueMap)
    if (variants.length && optionInfos.length) {
      return variants.reduce((result, variant) => {
        options.map((optionKey, idx) => {
          if (!result.get(optionKey)) result.set(optionKey, [])
          const key = `option${idx + 1}`
          // 过滤掉重复的 optionKey
          if (!result.get(optionKey).some(item => item.value === variant[key])) {
            const { id, value } = optionValueMap[optionKey].find(v => v.value === variant[key])
            result.get(optionKey).push({
              value,
              vaild: true, // vaild 为 true 可选，为false 不可选
              id // 把通过optionValueMap得到的每一项属性索引值当作id
            })
          }
        })
        return result
      }, enhancedOptionCollection)
    } else {
      return enhancedOptionCollection
    }
  }

  const vaildOptionCollection = getVaildOptionCollection(OPTIONS, VARIANTS, optionValueMap, SEPARATOR)
  /**
   * 得到有效的（不会置灰的）sku 信息 vaildOptionCollection。（默认传过来的数据（VARIANTS）均为有效的。缺失的、因为业务逻辑无效的会在后续操作中打入状态）
   * 通过这个 vaildOptionCollection 去做幂集生成全部且可用的带有每条变体信息的 sku 集合 SKUResult
   * 数据结构如下：
   * {
   *    'grey-s': { price: 366 },
   *    'blue-m': { price: 366 },
   * }
   * =>
   * {
   *    '1-3': { price: 366 },
   *    '2-4': { price: 366 },
   * }
   * 转成属性值对应的数字是为了做置灰判断时手动倒序（把反序的组合变成正序）然后去结果集合中查看是否存在组合，不存在就置灰
   * @param {*} variants
   * @param {*} optionValueMap
   * @param {*} separator
   */
  function getVaildOptionCollection (options, variants, optionValueMap, separator) {
    const vaildOptionCollection = {}
    const optionInfos = Object.keys(optionValueMap)
    if (variants.length && optionInfos.length && separator) {
      variants.map(variant => {
        const optionValueIds = variant.options.map((optionValue, idx) => {
          const { id } = optionValueMap[options[idx]].find(v => v.value === optionValue)
          return id
        })
        // 'grey-s' => '1-3'
        const optionValueMarkup = optionValueIds.join(separator)
        if (!vaildOptionCollection[optionValueMarkup]) vaildOptionCollection[optionValueMarkup] = variant
      })
      return vaildOptionCollection
    } else {
      return vaildOptionCollection
    }
  }

  const realVaildOptionCollection = getRealVaildOptionCollection(vaildOptionCollection)
  /**
   * 过滤掉无效的 sku，注意这里的无效包括数据上的、业务上的
   *
   * 需要置灰的 sku（无效的 sku）必须满足以下情况：
   * 1. [数据层面]: 当前sku是上传产品时缺失的sku。这种情况下，变体集合中不存在缺失的sku所以以变体集合variants来判断，其中有的sku就正常显示没有的就置灰
   * 2. [业务层面]: 当前sku的库存小于1 => inventory < 1 （大白说此条件不需要，暂不考虑）
   * 3. [业务层面]: 当前sku库存为0且不允许超卖 => inventory === 0 && tracked === 0。这种情况直接把该sku删掉和条件1保持一致
   *
   * 注意：
   * 1. 数据层面的问题，前端无法控制。即传过来的数据就当作全部 sku。
   * 2. 前端需要处理业务层面需要置灰的 sku（无效的 sku），即上面的 1、2
   * 3. enhancedOptionCollection 这个值是没有经过筛选的 sku 集合，直接用于模版渲染
   * 4. 而 realVaildOptionCollection 是经过筛选后的，页面上 sku 是否要置灰需要根据 realVaildOptionCollection 中存不存在该条 sku 来判断是否置灰，即存在就正常显示不存在就置灰
   *
   * @param {*} vaildOptionCollection
   */
  function getRealVaildOptionCollection (vaildOptionCollection) {
    const realVaildOptionCollection = {}
    const keys = Object.keys(vaildOptionCollection)
    if (keys.length) {
      keys.map(key => {
        if (Utils.isSafe(vaildOptionCollection[key])) {
          realVaildOptionCollection[key] = vaildOptionCollection[key]
        }
      })
      return realVaildOptionCollection
    } else {
      return realVaildOptionCollection
    }
  }

  const SKUResult = getSKUResult(realVaildOptionCollection, SEPARATOR)
  /**
   * 通过 realVaildOptionCollection separator 生成包含每条变体信息的 sku 集合
   * @param {*} realVaildOptionCollection
   * @param {*} separator
   */
  function getSKUResult (realVaildOptionCollection, separator) {
    const SKUResult = {}
    if (Object.keys(realVaildOptionCollection).length && separator) {
      return Utils.createSKUResult(realVaildOptionCollection, separator)
    } else {
      return SKUResult
    }
  }

  const active = getActive(OPTIONS)
  /**
   * 初始化active（每一个属性）的状态，默认设置为空
   * @param {*} options
   */
  function getActive (options) {
    // 对 options 长度不做判断，标品此项长度为0
    // todo 这里其实用 map 存是最合适的，但是 vue 不支持 map 的响应式只支持循环，所以这里只能使用 object，有关 active 的逻辑还是需要用 options 来修正顺序
    const active = {}
    if (options.length) {
      return options.reduce((result, optionKey) => {
        result[optionKey] = ''
        return result
      }, active)
    } else {
      return active
    }
  }

  return {
    Utils,
    ALL_CHOOSED,
    NO_CHOOSED,
    SOMEONE_CHOOSED,
    SEPARATOR,
    SKU_URL_PARAMETER,
    PRODUCT,
    IS_STANDARD_PRODUCT,
    OPTION_VALUE_NO_TRANSLATE_LIST,
    IS_SOLD_OUT,
    IS_REMOVED,
    active,
    optionValueMap,
    optionValueIds,
    enhancedOptionCollection,
    SKUResult
  }
}

const vVariant = Vue.component('v-variant', {
  name: 'v-variant',
  template:
  `
  <div class="product__variants">
    <template v-if="enhancedOptionCollection" v-for="[optionKey, optionValue] in enhancedOptionCollection">
      <section :class="['product__section', lackOptionKeys[optionKey] ? 'animated shake': '']" :data-option-key="optionKey">
        <div class="product__section__title">
          <span class="product__option__key">{{ optionKey }}</span>
          <span v-if="lackOptionKeys[optionKey]" class="lack-tip" style="margin-left: 15px;font-size: 14px;font-weight: 400;color: #f01130;">{{ lackOptionKeys[optionKey] }}</span>
        </div>
        <div class="product__section__content"> 
          <template v-for="optionValueInfo in optionValue">
            <div
              :id="componentUid + '-option-key:' + optionKey + '--option-value:' + optionValueInfo.value"
              class="product__option__value"
              :class="{
                'selected': optionValueInfo.vaild && active[optionKey] === optionValueInfo.id,
                'disabled': !optionValueInfo.vaild,
                'notranslate': isNoTranslate(optionValueInfo.value)
              }"
              @click="handleOptionValueClick(optionKey, optionValueInfo, $event)"
            >
              {{ optionValueInfo.value }}
            </div>
          </template>
        </div>
      </section>
    </template>
  </div>
  `,
  data: () => ({
    // ...initVariantData(window.WHSITE.PRODUCT),
    enhancedOptionCollection: null,
    choosedStatus: '',
    lackOptionKeys: {},
    isAutoSelect: false
  }),
  props: {
    product: Object,
    selectedImageId: String,
    openSetUrl: Boolean,
    lackTip: {
      type: String,
      default: 'Please Select {placeholder}'
    }
  },
  computed: {
    componentUid () {
      return this._uid
    },
    isNoTranslate () {
      return value => value ? this.OPTION_VALUE_NO_TRANSLATE_LIST.includes(value.trim().toLowerCase()) : false
    }
  },
  watch: {
    selectedImageId: {
      handler (newVal, oldVal) {
        if (newVal && newVal !== oldVal) this.handleImageInteractVariant(newVal)
      }
    }
  },
  created () {},
  mounted () {
    const startTime = new Date().getTime()
    const data = initVariantData(this.product)
    const endTime = new Date().getTime()
    // useConsole(`[initVariantData] => takes ${endTime - startTime}ms`)
    Object.keys(data).map(name => { this[name] = data[name] })

    this.$nextTick(() => {
      this.$emit('init')
      this.setTargetVariant()
    })
  },
  methods: {
    setOptionVaild (id, enhancedOptionCollection, toggle) {
      // 设置某一个属性的vaild
      // toggle: true正常 | false置灰
      for (const [optionKey, optionValue] of enhancedOptionCollection) {
        optionValue.map(option => {
          if (option.id === id) option.vaild = toggle
        })
      }
    },
    rewriteVaild (targetVariant) {
      // 避免切图片从 red { vaild: true }, m: { vaild: true } 切到 blue { vaild: true }, s: { vaild: false } ui 上 s 切不过去的情况
      const options = this.PRODUCT.options
      const targetVariantOptionValueIds = targetVariant.options.reduce((result, optionValue, idx) => {
        const { id } = this.optionValueMap[options[idx]].find(v => v.value === optionValue)
        result.push(id)
        return result
      }, [])
      if (this.SKUResult[targetVariantOptionValueIds.join(this.SEPARATOR)]) {
        targetVariantOptionValueIds.map(id => {
          this.setOptionVaild(id, this.enhancedOptionCollection, true)
        })
      }
      // this.$forceUpdate()
    },
    updateActive (targetVariant) {
      this.rewriteVaild(targetVariant)
      targetVariant.options.map((option, idx) => {
        const optionKey = this.PRODUCT.options[idx]
        const { id } = this.optionValueMap[optionKey].find(v => v.value === option)
        this.active[optionKey] = id
      })
    },
    /**
     * 设置当前选中的属性，初始化的时候 choosedSkuId 为空，切换图片联动时会传入 choosedSkuId
     * @param {*} choosedSkuId
     */
    setTargetVariant (choosedSkuId = '') {
      function getTargetVariantByChoosedSkuId (Utils, product, choosedSkuId) {
        // 通过切换图片后映射的 skuid 找到对应的 variant
        const targetVariantByChoosedSkuId = product.variants.filter(variant => Utils.isSafe(variant)).find(variant => variant.id === choosedSkuId)
        if (targetVariantByChoosedSkuId) {
          return targetVariantByChoosedSkuId
        } else {
          useConsole(`[getTargetVariantByChoosedSkuId]: target is null`)
          return null
        }
      }

      function getTargetVariantBySkuId (Utils, product, skuId) {
        // 通过 url 上的 skuId 找到对应的 variant
        const targetVariantBySkuId = product.variants.filter(variant => Utils.isSafe(variant)).filter(variant => Utils.isSafeWithDefaultSelected(variant)).find(variant => variant.id === skuId)
        if (targetVariantBySkuId) {
          return targetVariantBySkuId
        } else {
          useConsole(`[getTargetVariantBySkuId]: target is null`)
          return null
        }
      }

      function getStandardProductVariant (Utils, product) {
        // 标品设置默认sku
        // 因为标品没有规格，调用isSafeWithDefaultSelected方法无意义(无 isDefault 属性)
        // 找到第一个安全的sku即可
        const target = product.variants.find(variant => Utils.isSafe(variant))
        if (target) {
          return target
        } else {
          useConsole(`[getStandardProductVariant]: target is null`)
          return null
        }
      }

      function getNormalProductVariant (Utils, product) {
        // 普通商品设置默认sku
        // 先找到找到安全的sku集合，再通过 isSafeWithDefaultSelected 找到设置的默认sku
        const selectedSafeVariant = product.variants.find(variant => Utils.isSafeWithDefaultSelected(variant))
        if (selectedSafeVariant) {
          return selectedSafeVariant
        } else {
          useConsole(`[getNormalProductVariant]: target is null`)
          return null
        }
      }

      function getTargetVariant (Utils, product, skuId, choosedSkuId, isStandardProduct) {
        let targetVariant = null

        if (choosedSkuId) targetVariant = getTargetVariantByChoosedSkuId(Utils, product, choosedSkuId)

        if (!targetVariant) {
          if (skuId) targetVariant = getTargetVariantBySkuId(Utils, product, skuId)

          if (!targetVariant) {
            if (isStandardProduct) {
              // 标品（无规格商品）设置
              targetVariant = getStandardProductVariant(Utils, product)
            } else {
              // 普通商品（目前测试只测到1-3规格）设置
              targetVariant = getNormalProductVariant(Utils, product)
            }
          }
        }

        return targetVariant
      }

      const skuId = getQueryString(this.SKU_URL_PARAMETER)
      const targetVariant = getTargetVariant(this.Utils, this.PRODUCT, skuId, choosedSkuId, this.IS_STANDARD_PRODUCT)

      if (targetVariant) {
        this.updateActive(targetVariant)
      }

      this.checkValid()
    },
    getIdsByActive () {
      const { Utils, active } = this
      // 取出选中的属性id
      let selectedIds = Object.keys(active).map(optionKey => {
        if (active[optionKey]) return active[optionKey]
      }).filter(hasValue)
      // 把倒序转为正序
      selectedIds = Utils.transform2PositiveSequence(selectedIds)
      return selectedIds
    },
    /**
     * 检测是否要置灰
     */
    checkValid () {
      const { Utils, ALL_CHOOSED, NO_CHOOSED, SOMEONE_CHOOSED, SEPARATOR, optionValueIds, enhancedOptionCollection, SKUResult, active, setOptionVaild, getIdsByActive, checkEveryOptionValue, handleVariantsAndVariantStatusBySelectedIds, handleVariantSelected } = this
      const [choosedOption, choosedStatus] = Utils.optionSelectedState(active)
      this.choosedStatus = choosedStatus
      // 取出选中的属性id
      let selectedIds = getIdsByActive()
      // 判断极端状态，是否帮用户自动选择
      if (this.isAutoSelect) {
        const { autoSelectStauts, variants } = handleVariantsAndVariantStatusBySelectedIds(selectedIds)
        if (autoSelectStauts) {
          this.updateActive(variants[0]) // 修正active 以及属性的 vaild 值，方便重新拿到正确的active
          selectedIds = getIdsByActive()
        }
      }
      // 抛出当前选中的信息
      handleVariantSelected(selectedIds)

      if (choosedStatus === ALL_CHOOSED || choosedStatus === SOMEONE_CHOOSED) {
        // 从属性id数组中选出除选中外的属性id
        const len = selectedIds.length
        const notSelectedIds = optionValueIds.filter(id => selectedIds.every(_id => _id !== id))
        notSelectedIds.forEach(notSelectedId => {
          // 1. 用当前未被选中的属性 notSelectedId 找到当前层级中被选中的属性 id
          const SiblingSelectedIds = Utils.getSiblingSelectedIds(notSelectedId, enhancedOptionCollection, active)
          let selectedIdsMarkup = []
          // 2. 若找到当前层中有被选中的属性 id 则进入 if，否则进入 else
          if (SiblingSelectedIds.length > 0) {
            // 2. 虽然这里写的是 > 0 但是每一层级只可能有一个属性被选中，这里也可以写成 .length === 1，所以直接取第一个id即为 siblingSelectedId（同级被选中的属性id）
            const siblingSelectedId = SiblingSelectedIds[0]
            // 从选中节点中去掉选中的兄弟节点
            for (let i = 0; i < len; i++) {
              // 3. 去掉当前未被选中属性id（notSelectedId）的层级中被选中的属性id
              // 4. 把新点击的属性id加入selectedIdsMarkup中组成新的 active
              if (selectedIds[i] !== siblingSelectedId) selectedIdsMarkup.push(selectedIds[i])
            }
          } else {
            selectedIdsMarkup = selectedIds.concat()
          }
          /**
           * selectedIdsMarkup 的情况有：
           * 1. 当前层中无选中元素，则直接拼接然后去 SKUResult 查找是否存在子集
           * 2. 当前层中有选中元素
           */
          selectedIdsMarkup = selectedIdsMarkup.concat(notSelectedId)
          // 5. 把倒序转为正序
          selectedIdsMarkup = Utils.transform2PositiveSequence(selectedIdsMarkup)
          // 6. 通过新组成active的id组合去SKUResult中若找到符合置灰条件的数据则将当前的未被选中的属性（notSelectedId）置灰，没有的话正常选中
          if (SKUResult[selectedIdsMarkup.join(SEPARATOR)]) {
            setOptionVaild(notSelectedId, enhancedOptionCollection, true)
          } else {
            setOptionVaild(notSelectedId, enhancedOptionCollection, false)
          }
        })
      } else {
        /**
         * 可能情况：
         * 1. 链接上的skuid在变体集合中不存在
         * 2. 链接中的skuid不能被当作默认选中的sku（可能是缺少的sku又或者是下架的）
         * 3. 全部反选掉，即当前没有一个属性被选择
         */
        checkEveryOptionValue()
      }

      this.$nextTick(() => {
        // vue2 不支持追踪 map 依赖需要手动刷新数据更新依赖
        this.$forceUpdate()
      })
    },
    /**
     * 检测每一个属性是否要置灰
     */
    checkEveryOptionValue () {
      const { Utils, optionValueIds, enhancedOptionCollection, SKUResult, setOptionVaild } = this
      optionValueIds.forEach(id => {
        if (SKUResult[id]) {
          setOptionVaild(id, enhancedOptionCollection, true)
        } else {
          setOptionVaild(id, enhancedOptionCollection, false)
        }
      })
    },
    /**
     * 更新url上的skuid
     */
    setUrlSkuId (IS_STANDARD_PRODUCT, SKU_URL_PARAMETER, variants) {
      if (!this.openSetUrl) return
      if (IS_STANDARD_PRODUCT) {
        // 标品虽然变体中有一条数据但是url不能带上sku参数
        updateHistoryState(SKU_URL_PARAMETER, null)
      } else {
        if (variants.length === 1) {
          // 只有 sku 确定后更新 url 上的 skuid
          updateHistoryState(SKU_URL_PARAMETER, variants[0])
        } else {
          // 没有属性被选择或者只选择了一部分属性都不设置 url 上的 skuid
          updateHistoryState(SKU_URL_PARAMETER, null)
        }
      }
    },
    handleVariantsAndVariantStatusBySelectedIds (selectedIds) {
      const { IS_STANDARD_PRODUCT, SOMEONE_CHOOSED, PRODUCT, SEPARATOR, SKUResult, choosedStatus } = this
      let variants = []

      // 根据 selectedIds 找到对应的 sku 数据
      if (!selectedIds.length) {
        variants = []
      } else {
        const { ids } = SKUResult[selectedIds.join(SEPARATOR)]
        variants = ids.reduce((variants, skuId) => {
          variants.push(PRODUCT.variants.find(variant => variant.id === skuId))
          return variants.filter(hasValue)
        }, [])
      }

      let autoSelectStauts = false
      // 根据 choosedStatus 和找到的 sku 数据判断特殊状态
      if (choosedStatus === SOMEONE_CHOOSED && variants.length === 1) {
        // size：s m l，color：red blue
        // 避免出现选择 color 选 red，但是 size 中只能选 l，自动给用户选上，减少一次操作
        autoSelectStauts = true
      } else {
        autoSelectStauts = false
      }

      return {
        autoSelectStauts,
        variants
      }
    },
    /**
     * 通过选中的 optionValue id 找到对应的 variant 并返回
     * @param {*} selectedIds
     */
    handleVariantSelected (selectedIds = this.getIdsByActive()) {
      const { IS_STANDARD_PRODUCT, SKU_URL_PARAMETER, IS_SOLD_OUT,IS_REMOVED, PRODUCT } = this
      const { autoSelectStauts, variants: _variants } = this.handleVariantsAndVariantStatusBySelectedIds(selectedIds)

      // 设置 url 上的 skuid
      if (_variants.length === 1) {
        this.setUrlSkuId(IS_STANDARD_PRODUCT, SKU_URL_PARAMETER, _variants)
      } else {
        this.setUrlSkuId(IS_STANDARD_PRODUCT, SKU_URL_PARAMETER, [])
      }

      // sku 改变检测是否有要取消的未选提示
      this.clearTip()

      // 如果是标品直接把唯一的变体抛出去
      let variants = _variants
      if (IS_STANDARD_PRODUCT) variants = PRODUCT.variants

      this.$emit('change', {
        isRemoved:IS_REMOVED,
        isSoldOut: IS_SOLD_OUT,
        isStarndardProduct: IS_STANDARD_PRODUCT,
        selectedVariants: variants,
        selectedVariant: variants.length === 1 ? variants[0] : null
      })
    },
    /**
     *
     * @param {optionKey} optionKey
     * @param {*} optionValueInfo
     * @param {*} event
     * 控制属性选中/取消
     */
    handleOptionValueClick (optionKey, optionValueInfo, event) {
      const { id, vaild } = optionValueInfo
      if (vaild) {
        if (this.active[optionKey] === id) {
          // 反选
          this.$set(this.active, optionKey, '')
          this.isAutoSelect = false
        } else {
          this.$set(this.active, optionKey, id)
          // 只在正选的时候允许自动选择
          this.isAutoSelect = true
        }
        this.checkValid()
      }
    },
    // 图片切换，属性联动
    handleImageInteractVariant (selectedImageId) {
      const selectedImage = this.PRODUCT.media.find(media => media.id === selectedImageId)
      if (selectedImage) {
        if (selectedImage.variantIds.length === 1) {
          this.setTargetVariant(selectedImage.variantIds[0])
        } else {
          // 一张图对应多个sku或一张图对应零个sku的情况，直接返回，不进行联动
          return
        }
      } else {
        // 没有找到匹配图片，脏数据、历史数据等，直接返回，不进行联动
        return
      }
    },
    /**
     * 检测是否有没有选择的规格，如果没有则给出提示
     */
    validate () {
      const { enhancedOptionCollection, active, lackOptionKeys, lackTip } = this
      const _lackOptionKeys = []
      Object.keys(active).map(optionKey => {
        const optionValue = active[optionKey]
        // 兜底出现点击图片属性联动后出现 disable 的情况，这种情况下需要提示，让用户重新选择属性
        const invaildValues = enhancedOptionCollection.get(optionKey).filter(value => !value.vaild)
        const isContainInvaildValue = invaildValues.find(value => value.id === optionValue)

        if (!optionValue || (optionValue && isContainInvaildValue)) {
          this.$set(lackOptionKeys, optionKey, lackTip.replace('{placeholder}', optionKey))
          _lackOptionKeys.push(optionKey)
        }
      })

      return {
        vaild: !_lackOptionKeys.length,
        invalidNames: _lackOptionKeys
      }
    },
    /**
     * 当用户选中属性时，取消规格的提示
     */
    clearTip () {
      const { active, lackOptionKeys } = this
      Object.keys(active).map(optionKey => {
        if (lackOptionKeys[optionKey]) {
          active[optionKey] && this.$set(lackOptionKeys, optionKey, '')
        }
      })
    },
    clearTips () {
      const { active, lackOptionKeys } = this
      Object.keys(active).map(optionKey => {
        if (lackOptionKeys[optionKey]) {
          this.$set(lackOptionKeys, optionKey, '')
        }
      })
    }
  }
})
