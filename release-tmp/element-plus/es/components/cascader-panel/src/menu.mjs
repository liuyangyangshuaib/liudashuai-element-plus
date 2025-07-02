import { defineComponent, getCurrentInstance, inject, ref, computed, onBeforeUnmount, resolveComponent, openBlock, createBlock, normalizeClass, withCtx, createCommentVNode, createElementBlock, createVNode, withModifiers, Fragment, createTextVNode, toDisplayString, normalizeStyle, renderList, renderSlot } from 'vue';
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
    const virtualListError = ref(false);
    const selectAllCache = ref({
      allNodes: /* @__PURE__ */ new Set(),
      checkedNodes: /* @__PURE__ */ new Set(),
      lastUpdateTime: 0,
      nodeCount: 0,
      checkedCount: 0
    });
    const selectAllDebounceTimer = ref(null);
    const isSelectAllProcessing = ref(false);
    const isEmpty = computed(() => !props.nodes.length);
    const isLoading = computed(() => !panel.initialLoaded);
    const menuId = computed(() => `${id.value}-${props.index}`);
    const showSelectAll = computed(() => panel.config.multiple && panel.config.showSelectAll);
    const selectAllText = computed(() => panel.config.selectAllText || t("el.cascader.selectAll"));
    const selectableNodes = computed(() => props.nodes.filter((node) => !node.isDisabled));
    const checkedNodes = computed(() => selectableNodes.value.filter((node) => node.checked));
    const isAllSelected = computed(() => selectableNodes.value.length > 0 && checkedNodes.value.length === selectableNodes.value.length);
    const isIndeterminate = computed(() => checkedNodes.value.length > 0 && checkedNodes.value.length < selectableNodes.value.length);
    const isAllDisabled = computed(() => selectableNodes.value.length === 0);
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
    const virtualListHeight = computed(() => {
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
    onBeforeUnmount(() => {
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
  const _component_loading = resolveComponent("loading");
  const _component_el_icon = resolveComponent("el-icon");
  const _component_el_checkbox = resolveComponent("el-checkbox");
  const _component_el_cascader_node = resolveComponent("el-cascader-node");
  const _component_FixedSizeList = resolveComponent("FixedSizeList");
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
          class: normalizeClass(_ctx.ns.e("select-all")),
          onClick: _ctx.handleSelectAll
        }, [
          createVNode(_component_el_checkbox, {
            "model-value": _ctx.isAllSelected,
            indeterminate: _ctx.isIndeterminate,
            disabled: _ctx.isAllDisabled || _ctx.isSelectAllProcessing,
            onClick: withModifiers(() => {
            }, ["stop"]),
            "onUpdate:modelValue": _ctx.handleSelectAllChange
          }, {
            default: withCtx(() => [
              _ctx.isSelectAllProcessing ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                createVNode(_component_el_icon, {
                  size: "14",
                  class: normalizeClass(_ctx.ns.is("loading"))
                }, {
                  default: withCtx(() => [
                    createVNode(_component_loading)
                  ]),
                  _: 1
                }, 8, ["class"]),
                createTextVNode(" " + toDisplayString(_ctx.t("el.cascader.processing")), 1)
              ], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                createTextVNode(toDisplayString(_ctx.selectAllText), 1)
              ], 64))
            ]),
            _: 1
          }, 8, ["model-value", "indeterminate", "disabled", "onClick", "onUpdate:modelValue"])
        ], 10, ["onClick"])) : createCommentVNode("v-if", true),
        !_ctx.isLoading && !_ctx.isEmpty && !_ctx.virtualListError ? (openBlock(), createBlock(_component_FixedSizeList, {
          key: 1,
          height: _ctx.virtualListHeight,
          "item-size": _ctx.virtualItemSize,
          data: _ctx.nodes,
          total: _ctx.nodes.length,
          class: normalizeClass([_ctx.ns.e("virtual-list"), "cascader-virtual-list"]),
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
          default: withCtx(({ data, index, style }) => [
            (openBlock(), createBlock(_component_el_cascader_node, {
              key: data[index].uid,
              node: data[index],
              "menu-id": _ctx.menuId,
              style: normalizeStyle(style),
              onExpand: _ctx.handleExpand
            }, null, 8, ["node", "menu-id", "style", "onExpand"]))
          ]),
          _: 1
        }, 8, ["height", "item-size", "data", "total", "class", "onScroll", "aria-label", "onError"])) : (openBlock(true), createElementBlock(Fragment, { key: 2 }, renderList(_ctx.nodes, (node) => {
          return openBlock(), createBlock(_component_el_cascader_node, {
            key: node.uid,
            node,
            "menu-id": _ctx.menuId,
            onExpand: _ctx.handleExpand
          }, null, 8, ["node", "menu-id", "onExpand"]);
        }), 128)),
        _ctx.isLoading ? (openBlock(), createElementBlock("div", {
          key: 3,
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
          key: 4,
          class: normalizeClass(_ctx.ns.e("empty-text"))
        }, [
          renderSlot(_ctx.$slots, "empty", {}, () => [
            createTextVNode(toDisplayString(_ctx.t("el.cascader.noData")), 1)
          ])
        ], 2)) : ((_a = _ctx.panel) == null ? void 0 : _a.isHoverMenu) ? (openBlock(), createElementBlock(Fragment, { key: 5 }, [
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
