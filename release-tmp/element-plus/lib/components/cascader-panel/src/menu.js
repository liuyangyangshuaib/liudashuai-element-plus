'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vue = require('vue');
var index$1 = require('../../scrollbar/index.js');
var iconsVue = require('@element-plus/icons-vue');
var index = require('../../icon/index.js');
var node = require('./node2.js');
var index$2 = require('../../checkbox/index.js');
var types = require('./types.js');
var pluginVue_exportHelper = require('../../../_virtual/plugin-vue_export-helper.js');
var fixedSizeList = require('../../virtual-list/src/components/fixed-size-list.js');
var index$3 = require('../../../hooks/use-namespace/index.js');
var index$4 = require('../../../hooks/use-locale/index.js');
var index$5 = require('../../../hooks/use-id/index.js');

const _sfc_main = vue.defineComponent({
  name: "ElCascaderMenu",
  components: {
    Loading: iconsVue.Loading,
    ElIcon: index.ElIcon,
    ElScrollbar: index$1.ElScrollbar,
    ElCascaderNode: node["default"],
    FixedSizeList: fixedSizeList["default"],
    ElCheckbox: index$2.ElCheckbox
  },
  props: {
    nodes: {
      type: Array,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const instance = vue.getCurrentInstance();
    const ns = index$3.useNamespace("cascader-menu");
    const { t } = index$4.useLocale();
    const id = index$5.useId();
    let activeNode = null;
    let hoverTimer = null;
    const panel = vue.inject(types.CASCADER_PANEL_INJECTION_KEY);
    const hoverZone = vue.ref(null);
    const virtualListError = vue.ref(false);
    const selectAllCache = vue.ref({
      allNodes: /* @__PURE__ */ new Set(),
      checkedNodes: /* @__PURE__ */ new Set(),
      lastUpdateTime: 0,
      nodeCount: 0,
      checkedCount: 0
    });
    const selectAllDebounceTimer = vue.ref(null);
    const isSelectAllProcessing = vue.ref(false);
    const isEmpty = vue.computed(() => !props.nodes.length);
    const isLoading = vue.computed(() => !panel.initialLoaded);
    const menuId = vue.computed(() => `${id.value}-${props.index}`);
    const showSelectAll = vue.computed(() => panel.config.multiple && panel.config.showSelectAll);
    const selectAllText = vue.computed(() => panel.config.selectAllText || t("el.cascader.selectAll"));
    const selectableNodes = vue.computed(() => props.nodes.filter((node) => !node.isDisabled));
    const checkedNodes = vue.computed(() => selectableNodes.value.filter((node) => node.checked));
    const isAllSelected = vue.computed(() => selectableNodes.value.length > 0 && checkedNodes.value.length === selectableNodes.value.length);
    const isIndeterminate = vue.computed(() => checkedNodes.value.length > 0 && checkedNodes.value.length < selectableNodes.value.length);
    const isAllDisabled = vue.computed(() => selectableNodes.value.length === 0);
    const updateSelectAllCache = () => {
      const now = Date.now();
      const cache = selectAllCache.value;
      const currentNodes = selectableNodes.value;
      if (cache.nodeCount === currentNodes.length && now - cache.lastUpdateTime < 200) {
        return;
      }
      const allNodeIds = /* @__PURE__ */ new Set();
      const checkedNodeIds = /* @__PURE__ */ new Set();
      let checkedCount = 0;
      const collectNodes = (nodes) => {
        nodes.forEach((node) => {
          allNodeIds.add(node.uid.toString());
          if (node.checked) {
            checkedNodeIds.add(node.uid.toString());
            checkedCount++;
          }
          if (node.children && node.children.length > 0) {
            collectNodes(node.children);
          }
        });
      };
      collectNodes(props.nodes);
      cache.allNodes = allNodeIds;
      cache.checkedNodes = checkedNodeIds;
      cache.lastUpdateTime = now;
      cache.nodeCount = currentNodes.length;
      cache.checkedCount = checkedCount;
    };
    const batchSelectAll = async (checked) => {
      if (isAllDisabled.value || isSelectAllProcessing.value)
        return;
      if (selectAllDebounceTimer.value) {
        clearTimeout(selectAllDebounceTimer.value);
        selectAllDebounceTimer.value = null;
      }
      selectAllDebounceTimer.value = window.setTimeout(async () => {
        isSelectAllProcessing.value = true;
        try {
          const startTime = performance.now();
          updateSelectAllCache();
          const nodesToProcess = selectableNodes.value;
          if (nodesToProcess.length === 0)
            return;
          if (nodesToProcess.length > 1e3) {
            const batchSize = 500;
            const totalBatches = Math.ceil(nodesToProcess.length / batchSize);
            for (let i = 0; i < totalBatches; i++) {
              const start = i * batchSize;
              const end = Math.min(start + batchSize, nodesToProcess.length);
              const batch = nodesToProcess.slice(start, end);
              panel.batchCheckChange(batch, checked, false);
              if (i < totalBatches - 1) {
                await new Promise((resolve) => requestAnimationFrame(resolve));
              }
            }
          } else {
            panel.batchCheckChange(nodesToProcess, checked, false);
          }
          const endTime = performance.now();
          if (process.env.NODE_ENV === "development") {
            console.log(`[Cascader] \u5168\u9009\u64CD\u4F5C\u5B8C\u6210\uFF0C\u5904\u7406 ${nodesToProcess.length} \u4E2A\u8282\u70B9\uFF0C\u8017\u65F6 ${(endTime - startTime).toFixed(2)}ms`);
          }
        } finally {
          isSelectAllProcessing.value = false;
        }
      }, 50);
    };
    const virtualListHeight = vue.computed(() => {
      const baseHeight = 192;
      return showSelectAll.value ? baseHeight - 34 : baseHeight;
    });
    const virtualItemSize = 34;
    const handleExpand = (e) => {
      activeNode = e.target;
    };
    const handleMouseMove = (e) => {
      if (!panel.isHoverMenu || !activeNode || !hoverZone.value)
        return;
      if (activeNode.contains(e.target)) {
        clearHoverTimer();
        const el = instance.vnode.el;
        const { left } = el.getBoundingClientRect();
        const { offsetWidth, offsetHeight } = el;
        const startX = e.clientX - left;
        const top = activeNode.offsetTop;
        const bottom = top + activeNode.offsetHeight;
        hoverZone.value.innerHTML = `
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${top} L${offsetWidth} 0 V${top} Z" />
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${bottom} L${offsetWidth} ${offsetHeight} V${bottom} Z" />
        `;
      } else if (!hoverTimer) {
        hoverTimer = window.setTimeout(clearHoverZone, panel.config.hoverThreshold);
      }
    };
    const clearHoverTimer = () => {
      if (!hoverTimer)
        return;
      clearTimeout(hoverTimer);
      hoverTimer = null;
    };
    const clearHoverZone = () => {
      if (!hoverZone.value)
        return;
      hoverZone.value.innerHTML = "";
      clearHoverTimer();
    };
    const handleVirtualListScroll = (e) => {
      const target = e.target;
      if (target && panel.isHoverMenu) {
        clearHoverZone();
      }
    };
    const handleVirtualListError = () => {
      virtualListError.value = true;
    };
    const handleSelectAll = () => {
      if (isAllDisabled.value)
        return;
      const shouldSelect = !isAllSelected.value;
      batchSelectAll(shouldSelect);
    };
    const handleSelectAllChange = (checked) => {
      if (isAllDisabled.value)
        return;
      batchSelectAll(checked);
    };
    vue.onBeforeUnmount(() => {
      if (selectAllDebounceTimer.value) {
        clearTimeout(selectAllDebounceTimer.value);
        selectAllDebounceTimer.value = null;
      }
    });
    return {
      ns,
      panel,
      hoverZone,
      isEmpty,
      isLoading,
      menuId,
      t,
      handleExpand,
      handleMouseMove,
      clearHoverZone,
      virtualListHeight,
      virtualItemSize,
      handleVirtualListScroll,
      virtualListError,
      handleVirtualListError,
      showSelectAll,
      selectAllText,
      selectableNodes,
      checkedNodes,
      isAllSelected,
      isIndeterminate,
      isAllDisabled,
      handleSelectAll,
      handleSelectAllChange,
      isSelectAllProcessing
    };
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_loading = vue.resolveComponent("loading");
  const _component_el_icon = vue.resolveComponent("el-icon");
  const _component_el_checkbox = vue.resolveComponent("el-checkbox");
  const _component_el_cascader_node = vue.resolveComponent("el-cascader-node");
  const _component_FixedSizeList = vue.resolveComponent("FixedSizeList");
  const _component_el_scrollbar = vue.resolveComponent("el-scrollbar");
  return vue.openBlock(), vue.createBlock(_component_el_scrollbar, {
    key: _ctx.menuId,
    tag: "ul",
    role: "menu",
    class: vue.normalizeClass(_ctx.ns.b()),
    "wrap-class": _ctx.ns.e("wrap"),
    "view-class": [_ctx.ns.e("list"), _ctx.ns.is("empty", _ctx.isEmpty)],
    onMousemove: _ctx.handleMouseMove,
    onMouseleave: _ctx.clearHoverZone
  }, {
    default: vue.withCtx(() => {
      var _a;
      return [
        vue.createCommentVNode(" \u5168\u9009\u6309\u94AE "),
        _ctx.showSelectAll ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          class: vue.normalizeClass(_ctx.ns.e("select-all")),
          onClick: _ctx.handleSelectAll
        }, [
          vue.createVNode(_component_el_checkbox, {
            "model-value": _ctx.isAllSelected,
            indeterminate: _ctx.isIndeterminate,
            disabled: _ctx.isAllDisabled || _ctx.isSelectAllProcessing,
            onClick: vue.withModifiers(() => {
            }, ["stop"]),
            "onUpdate:modelValue": _ctx.handleSelectAllChange
          }, {
            default: vue.withCtx(() => [
              _ctx.isSelectAllProcessing ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 0 }, [
                vue.createVNode(_component_el_icon, {
                  size: "14",
                  class: vue.normalizeClass(_ctx.ns.is("loading"))
                }, {
                  default: vue.withCtx(() => [
                    vue.createVNode(_component_loading)
                  ]),
                  _: 1
                }, 8, ["class"]),
                vue.createTextVNode(" " + vue.toDisplayString(_ctx.t("el.cascader.processing")), 1)
              ], 64)) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 1 }, [
                vue.createTextVNode(vue.toDisplayString(_ctx.selectAllText), 1)
              ], 64))
            ]),
            _: 1
          }, 8, ["model-value", "indeterminate", "disabled", "onClick", "onUpdate:modelValue"])
        ], 10, ["onClick"])) : vue.createCommentVNode("v-if", true),
        !_ctx.isLoading && !_ctx.isEmpty && !_ctx.virtualListError ? (vue.openBlock(), vue.createBlock(_component_FixedSizeList, {
          key: 1,
          height: _ctx.virtualListHeight,
          "item-size": _ctx.virtualItemSize,
          data: _ctx.nodes,
          total: _ctx.nodes.length,
          class: vue.normalizeClass([_ctx.ns.e("virtual-list"), "cascader-virtual-list"]),
          "scrollbar-always-on": false,
          cache: 2,
          onScroll: _ctx.handleVirtualListScroll,
          "use-is-scrolling": false,
          "perf-mode": true,
          "container-element": "div",
          "inner-element": "div",
          role: "listbox",
          "aria-label": _ctx.t("el.cascader.options"),
          onError: _ctx.handleVirtualListError
        }, {
          default: vue.withCtx(({ data, index, style }) => [
            (vue.openBlock(), vue.createBlock(_component_el_cascader_node, {
              key: data[index].uid,
              node: data[index],
              "menu-id": _ctx.menuId,
              style: vue.normalizeStyle(style),
              onExpand: _ctx.handleExpand
            }, null, 8, ["node", "menu-id", "style", "onExpand"]))
          ]),
          _: 1
        }, 8, ["height", "item-size", "data", "total", "class", "onScroll", "aria-label", "onError"])) : (vue.openBlock(true), vue.createElementBlock(vue.Fragment, { key: 2 }, vue.renderList(_ctx.nodes, (node) => {
          return vue.openBlock(), vue.createBlock(_component_el_cascader_node, {
            key: node.uid,
            node,
            "menu-id": _ctx.menuId,
            onExpand: _ctx.handleExpand
          }, null, 8, ["node", "menu-id", "onExpand"]);
        }), 128)),
        _ctx.isLoading ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 3,
          class: vue.normalizeClass(_ctx.ns.e("empty-text"))
        }, [
          vue.createVNode(_component_el_icon, {
            size: "14",
            class: vue.normalizeClass(_ctx.ns.is("loading"))
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_component_loading)
            ]),
            _: 1
          }, 8, ["class"]),
          vue.createTextVNode(" " + vue.toDisplayString(_ctx.t("el.cascader.loading")), 1)
        ], 2)) : _ctx.isEmpty ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 4,
          class: vue.normalizeClass(_ctx.ns.e("empty-text"))
        }, [
          vue.renderSlot(_ctx.$slots, "empty", {}, () => [
            vue.createTextVNode(vue.toDisplayString(_ctx.t("el.cascader.noData")), 1)
          ])
        ], 2)) : ((_a = _ctx.panel) == null ? void 0 : _a.isHoverMenu) ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 5 }, [
          vue.createCommentVNode(" eslint-disable-next-line vue/html-self-closing "),
          (vue.openBlock(), vue.createElementBlock("svg", {
            ref: "hoverZone",
            class: vue.normalizeClass(_ctx.ns.e("hover-zone"))
          }, null, 2))
        ], 2112)) : vue.createCommentVNode("v-if", true)
      ];
    }),
    _: 3
  }, 8, ["class", "wrap-class", "view-class", "onMousemove", "onMouseleave"]);
}
var ElCascaderMenu = /* @__PURE__ */ pluginVue_exportHelper["default"](_sfc_main, [["render", _sfc_render], ["__file", "menu.vue"]]);

exports["default"] = ElCascaderMenu;
//# sourceMappingURL=menu.js.map
