import { defineComponent, getCurrentInstance, inject, ref, computed, resolveComponent, openBlock, createBlock, normalizeClass, withCtx, createCommentVNode, createElementBlock, createVNode, withModifiers, createTextVNode, toDisplayString, Fragment, renderList, renderSlot } from 'vue';
import { ElScrollbar } from '../../scrollbar/index.mjs';
import { Loading } from '@element-plus/icons-vue';
import { ElIcon } from '../../icon/index.mjs';
import ElCascaderNode from './node2.mjs';
import { ElCheckbox } from '../../checkbox/index.mjs';
import { CASCADER_PANEL_INJECTION_KEY } from './types.mjs';
import _export_sfc from '../../../_virtual/plugin-vue_export-helper.mjs';
import FixedSizeList from '../../virtual-list/src/components/fixed-size-list.mjs';
import { useNamespace } from '../../../hooks/use-namespace/index.mjs';
import { useLocale } from '../../../hooks/use-locale/index.mjs';
import { useId } from '../../../hooks/use-id/index.mjs';

const _sfc_main = defineComponent({
  name: "ElCascaderMenu",
  components: {
    Loading,
    ElIcon,
    ElScrollbar,
    ElCascaderNode,
    FixedSizeList,
    ElCheckbox
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
    const instance = getCurrentInstance();
    const ns = useNamespace("cascader-menu");
    const { t } = useLocale();
    const id = useId();
    let activeNode = null;
    let hoverTimer = null;
    const panel = inject(CASCADER_PANEL_INJECTION_KEY);
    const hoverZone = ref(null);
    const isEmpty = computed(() => !props.nodes.length);
    const isLoading = computed(() => !panel.initialLoaded);
    const menuId = computed(() => `${id.value}-${props.index}`);
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
    const showSelectAll = computed(() => panel.config.multiple && panel.config.showSelectAll);
    const selectAllText = computed(() => panel.config.selectAllText || t("el.cascader.selectAll"));
    const batchSelectAll = (checked) => {
      const nodes = props.nodes;
      for (const node of nodes) {
        node.doCheck(checked);
      }
      panel.triggerCheckChange();
    };
    const isAllSelected = computed(() => {
      return props.nodes.every((node) => node.checked);
    });
    const isIndeterminate = computed(() => {
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
  const _component_el_checkbox = resolveComponent("el-checkbox");
  const _component_el_cascader_node = resolveComponent("el-cascader-node");
  const _component_loading = resolveComponent("loading");
  const _component_el_icon = resolveComponent("el-icon");
  const _component_el_scrollbar = resolveComponent("el-scrollbar");
  return openBlock(), createBlock(_component_el_scrollbar, {
    key: _ctx.menuId,
    tag: "ul",
    role: "menu",
    class: normalizeClass(_ctx.ns.b()),
    "wrap-class": _ctx.ns.e("wrap"),
    "view-class": [_ctx.ns.e("list"), _ctx.ns.is("empty", _ctx.isEmpty)],
    onMousemove: _ctx.handleMouseMove,
    onMouseleave: _ctx.clearHoverZone
  }, {
    default: withCtx(() => {
      var _a;
      return [
        createCommentVNode(" \u5168\u9009\u6309\u94AE "),
        _ctx.showSelectAll ? (openBlock(), createElementBlock("div", {
          key: 0,
          class: normalizeClass(_ctx.ns.e("select-all"))
        }, [
          createVNode(_component_el_checkbox, {
            "model-value": _ctx.isAllSelected,
            indeterminate: _ctx.isIndeterminate,
            onClick: withModifiers(() => {
            }, ["stop"]),
            "onUpdate:modelValue": _ctx.handleSelectAllChange
          }, {
            default: withCtx(() => [
              createTextVNode(toDisplayString(_ctx.selectAllText), 1)
            ]),
            _: 1
          }, 8, ["model-value", "indeterminate", "onClick", "onUpdate:modelValue"])
        ], 2)) : createCommentVNode("v-if", true),
        createCommentVNode(" :onVnodeMounted \u4E3A\u4EC0\u4E48\u8981\u6DFB\u52A0\u8FD9\u4E2A\u4EE3\u7801? \n     1. index\u7684addNodeByValue \u548CremoveNodeByValue \u4E2D \u4F7F\u7528\u7684\u662Fdocheck \n     docheck \u5E76\u4E0D\u4F1A\u89E6\u53D1\u6570\u636E\u7684\u54CD\u5E94\u5F0F\u4F9D\u8D56 vue\u76D1\u542C\u4E0D\u5230  \u6240\u4EE5\u5728\u8FD9\u91CC\u6DFB\u52A0\u94A9\u5B50 \u642D\u914Dlist\u4E2D\u7684 menus.value = [...menus.value] \n     \u80FD\u5F3A\u5236\u66F4\u65B0\u89C6\u56FE \u4F46\u662F \u6027\u80FD\u4F1A\u4E0B\u964D "),
        (openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.nodes, (node) => {
          return openBlock(), createBlock(_component_el_cascader_node, {
            key: node.uid,
            node,
            "menu-id": _ctx.menuId,
            onExpand: _ctx.handleExpand,
            onVnodeMounted: () => {
            }
          }, null, 8, ["node", "menu-id", "onExpand", "onVnodeMounted"]);
        }), 128)),
        _ctx.isLoading ? (openBlock(), createElementBlock("div", {
          key: 1,
          class: normalizeClass(_ctx.ns.e("empty-text"))
        }, [
          createVNode(_component_el_icon, {
            size: "14",
            class: normalizeClass(_ctx.ns.is("loading"))
          }, {
            default: withCtx(() => [
              createVNode(_component_loading)
            ]),
            _: 1
          }, 8, ["class"]),
          createTextVNode(" " + toDisplayString(_ctx.t("el.cascader.loading")), 1)
        ], 2)) : createCommentVNode("v-if", true),
        createCommentVNode(' <el-cascader-node v-for="node in nodes" :key="node.uid" :node="node" :menu-id="menuId" @expand="handleExpand"\n        :onVnodeMounted="() => logRenderNode(node.uid)" /> '),
        _ctx.isLoading ? (openBlock(), createElementBlock("div", {
          key: 2,
          class: normalizeClass(_ctx.ns.e("empty-text"))
        }, [
          createVNode(_component_el_icon, {
            size: "14",
            class: normalizeClass(_ctx.ns.is("loading"))
          }, {
            default: withCtx(() => [
              createVNode(_component_loading)
            ]),
            _: 1
          }, 8, ["class"]),
          createTextVNode(" " + toDisplayString(_ctx.t("el.cascader.loading")), 1)
        ], 2)) : _ctx.isEmpty ? (openBlock(), createElementBlock("div", {
          key: 3,
          class: normalizeClass(_ctx.ns.e("empty-text"))
        }, [
          renderSlot(_ctx.$slots, "empty", {}, () => [
            createTextVNode(toDisplayString(_ctx.t("el.cascader.noData")), 1)
          ])
        ], 2)) : ((_a = _ctx.panel) == null ? void 0 : _a.isHoverMenu) ? (openBlock(), createElementBlock(Fragment, { key: 4 }, [
          createCommentVNode(" eslint-disable-next-line vue/html-self-closing "),
          (openBlock(), createElementBlock("svg", {
            ref: "hoverZone",
            class: normalizeClass(_ctx.ns.e("hover-zone"))
          }, null, 2))
        ], 2112)) : createCommentVNode("v-if", true)
      ];
    }),
    _: 3
  }, 8, ["class", "wrap-class", "view-class", "onMousemove", "onMouseleave"]);
}
var ElCascaderMenu = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "menu.vue"]]);

export { ElCascaderMenu as default };
//# sourceMappingURL=menu.mjs.map
