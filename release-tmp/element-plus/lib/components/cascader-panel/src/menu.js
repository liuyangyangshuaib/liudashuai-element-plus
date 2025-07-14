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
    },
    modelValue: {
      type: Object,
      default: () => ({ allSelected: false, exceptions: [] })
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
    const isEmpty = vue.computed(() => !props.nodes.length);
    const isLoading = vue.computed(() => !panel.initialLoaded);
    const menuId = vue.computed(() => `${id.value}-${props.index}`);
    const handleExpand = (e) => {
      console.log(e.target, "e.target");
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
    const showSelectAll = vue.computed(() => panel.config.multiple && panel.config.showSelectAll);
    const selectAllText = vue.computed(() => panel.config.selectAllText || t("el.cascader.selectAll"));
    const batchSelectAll = (checked) => {
      const nodes = props.nodes;
      for (const node of nodes) {
        node.doCheck(checked);
      }
    };
    const isAllSelected = vue.computed(() => {
      return props.nodes.every((node) => node.checked);
    });
    const isIndeterminate = vue.computed(() => {
      return props.nodes.some((node) => node.checked) && !props.nodes.every((node) => node.checked);
    });
    const handleSelectAllChange = (checked) => {
      batchSelectAll(checked);
    };
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
      handleSelectAllChange,
      isAllSelected,
      isIndeterminate,
      showSelectAll,
      selectAllText
    };
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_el_checkbox = vue.resolveComponent("el-checkbox");
  const _component_el_cascader_node = vue.resolveComponent("el-cascader-node");
  const _component_loading = vue.resolveComponent("loading");
  const _component_el_icon = vue.resolveComponent("el-icon");
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
          class: vue.normalizeClass(_ctx.ns.e("select-all"))
        }, [
          vue.createVNode(_component_el_checkbox, {
            "model-value": _ctx.isAllSelected,
            indeterminate: _ctx.isIndeterminate,
            onClick: vue.withModifiers(() => {
            }, ["stop"]),
            "onUpdate:modelValue": _ctx.handleSelectAllChange
          }, {
            default: vue.withCtx(() => [
              vue.createTextVNode(vue.toDisplayString(_ctx.selectAllText), 1)
            ]),
            _: 1
          }, 8, ["model-value", "indeterminate", "onClick", "onUpdate:modelValue"])
        ], 2)) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" :onVnodeMounted \u4E3A\u4EC0\u4E48\u8981\u6DFB\u52A0\u8FD9\u4E2A\u4EE3\u7801? \n     1. index\u7684addNodeByValue \u548CremoveNodeByValue \u4E2D \u4F7F\u7528\u7684\u662Fdocheck \n     docheck \u5E76\u4E0D\u4F1A\u89E6\u53D1\u6570\u636E\u7684\u54CD\u5E94\u5F0F\u4F9D\u8D56 vue\u76D1\u542C\u4E0D\u5230  \u6240\u4EE5\u5728\u8FD9\u91CC\u6DFB\u52A0\u94A9\u5B50 \u642D\u914Dlist\u4E2D\u7684 menus.value = [...menus.value] \n     \u80FD\u5F3A\u5236\u66F4\u65B0\u89C6\u56FE \u4F46\u662F \u6027\u80FD\u4F1A\u4E0B\u964D "),
        (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(_ctx.nodes, (node) => {
          return vue.openBlock(), vue.createBlock(_component_el_cascader_node, {
            key: node.uid,
            node,
            "menu-id": _ctx.menuId,
            onExpand: _ctx.handleExpand,
            onVnodeMounted: () => {
            }
          }, null, 8, ["node", "menu-id", "onExpand", "onVnodeMounted"]);
        }), 128)),
        _ctx.isLoading ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 1,
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
        ], 2)) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(' <el-cascader-node v-for="node in nodes" :key="node.uid" :node="node" :menu-id="menuId" @expand="handleExpand"\n        :onVnodeMounted="() => logRenderNode(node.uid)" /> '),
        _ctx.isLoading ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 2,
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
          key: 3,
          class: vue.normalizeClass(_ctx.ns.e("empty-text"))
        }, [
          vue.renderSlot(_ctx.$slots, "empty", {}, () => [
            vue.createTextVNode(vue.toDisplayString(_ctx.t("el.cascader.noData")), 1)
          ])
        ], 2)) : ((_a = _ctx.panel) == null ? void 0 : _a.isHoverMenu) ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 4 }, [
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
