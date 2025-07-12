import { defineComponent, getCurrentInstance, inject, ref, computed, onBeforeUnmount, watch, resolveComponent, openBlock, createBlock, normalizeClass, withCtx, createCommentVNode, createElementBlock, createVNode, withModifiers, Fragment, createTextVNode, toDisplayString, renderList, renderSlot } from 'vue';
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
  setup(props, { emit }) {
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
    const isAllSelectedFlag = ref(false);
    const checkedExceptions = ref(/* @__PURE__ */ new Set());
    const selectedNodes = ref(/* @__PURE__ */ new Set());
    function isNodeChecked(nodeUid) {
      if (isAllSelectedFlag.value) {
        return !checkedExceptions.value.has(nodeUid);
      } else {
        return checkedExceptions.value.has(nodeUid);
      }
    }
    function handleSelectAll(checked) {
      isAllSelectedFlag.value = checked;
      checkedExceptions.value.clear();
      emitSelected();
    }
    function handleNodeCheck(nodeUid, checked) {
      if (isAllSelectedFlag.value) {
        if (!checked)
          checkedExceptions.value.add(nodeUid);
        else
          checkedExceptions.value.delete(nodeUid);
      } else {
        if (checked)
          checkedExceptions.value.add(nodeUid);
        else
          checkedExceptions.value.delete(nodeUid);
      }
      emitSelected();
    }
    function emitSelected() {
      if (instance && instance.emit) {
        instance.emit("update:modelValue", {
          allSelected: isAllSelectedFlag.value,
          exceptions: Array.from(checkedExceptions.value)
        });
      }
    }
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
          updateSelectAllCache();
          const nodesToProcess = selectableNodes.value;
          if (nodesToProcess.length === 0)
            return;
          const batchSize = 200;
          const totalBatches = Math.ceil(nodesToProcess.length / batchSize);
          for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, nodesToProcess.length);
            const batch = nodesToProcess.slice(start, end);
            panel.batchCheckChange(batch, checked, i === totalBatches - 1);
            if (i < totalBatches - 1) {
              await new Promise((resolve) => requestAnimationFrame(resolve));
            }
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
    function logRenderNode(nodeUid) {
    }
    watch(() => props.modelValue, (val) => {
      if (val && typeof val === "object") {
        isAllSelectedFlag.value = !!val.allSelected;
        checkedExceptions.value = new Set(val.exceptions || []);
      }
    }, { immediate: true });
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
      isSelectAllProcessing,
      isNodeChecked,
      handleNodeCheck,
      logRenderNode,
      selectedNodes
    };
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_loading = resolveComponent("loading");
  const _component_el_icon = resolveComponent("el-icon");
  const _component_el_checkbox = resolveComponent("el-checkbox");
  const _component_el_cascader_node = resolveComponent("el-cascader-node");
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
        createCommentVNode(` <FixedSizeList v-if="!isLoading && !isEmpty && !virtualListError" :height="virtualListHeight"
      :item-size="virtualItemSize" :data="nodes" :total="nodes.length"
      :class="[ns.e('virtual-list'), 'cascader-virtual-list']" :scrollbar-always-on="false"
      @scroll="handleVirtualListScroll" :use-is-scrolling="false" :perf-mode="true" container-element="div"
      inner-element="div" role="listbox" :aria-label="t('el.cascader.options')" @error="handleVirtualListError"
      ref="virtualListRef">
      <template #default="{ data, index, style }" :key="virtualListKey">
      </template>
    </FixedSizeList> `),
        (openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.nodes, (node) => {
          return openBlock(), createBlock(_component_el_cascader_node, {
            key: node.uid,
            node,
            "menu-id": _ctx.menuId,
            onExpand: _ctx.handleExpand,
            onCheck: _ctx.handleNodeCheck,
            checked: _ctx.isNodeChecked(node.uid),
            onVnodeMounted: () => _ctx.logRenderNode(node.uid)
          }, null, 8, ["node", "menu-id", "onExpand", "onCheck", "checked", "onVnodeMounted"]);
        }), 128)),
        createCommentVNode(' <el-cascader-node v-for="node in nodes" :key="node.uid" :node="node" :menu-id="menuId" @expand="handleExpand"\n        :onVnodeMounted="() => logRenderNode(node.uid)" /> '),
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
        ], 2)) : _ctx.isEmpty ? (openBlock(), createElementBlock("div", {
          key: 2,
          class: normalizeClass(_ctx.ns.e("empty-text"))
        }, [
          renderSlot(_ctx.$slots, "empty", {}, () => [
            createTextVNode(toDisplayString(_ctx.t("el.cascader.noData")), 1)
          ])
        ], 2)) : ((_a = _ctx.panel) == null ? void 0 : _a.isHoverMenu) ? (openBlock(), createElementBlock(Fragment, { key: 3 }, [
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
