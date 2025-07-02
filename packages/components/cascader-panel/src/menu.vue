<template>
  <el-scrollbar :key="menuId" tag="ul" role="menu" :class="ns.b()" :wrap-class="ns.e('wrap')"
    :view-class="[ns.e('list'), ns.is('empty', isEmpty)]" @mousemove="handleMouseMove" @mouseleave="clearHoverZone">
    <!-- 全选按钮 -->
    <div v-if="showSelectAll" :class="ns.e('select-all')" @click="handleSelectAll">
      <el-checkbox :model-value="isAllSelected" :indeterminate="isIndeterminate"
        :disabled="isAllDisabled || isSelectAllProcessing" @click.stop @update:model-value="handleSelectAllChange">
        <template v-if="isSelectAllProcessing">
          <el-icon size="14" :class="ns.is('loading')">
            <loading />
          </el-icon>
          {{ t('el.cascader.processing') }}
        </template>
        <template v-else>
          {{ selectAllText }}
        </template>
      </el-checkbox>
    </div>

    <FixedSizeList v-if="!isLoading && !isEmpty && !virtualListError" :height="virtualListHeight"
      :item-size="virtualItemSize" :data="nodes" :total="nodes.length"
      :class="[ns.e('virtual-list'), 'cascader-virtual-list']" :scrollbar-always-on="false" :cache="2"
      @scroll="handleVirtualListScroll" :use-is-scrolling="false" :perf-mode="true" container-element="div"
      inner-element="div" role="listbox" :aria-label="t('el.cascader.options')" @error="handleVirtualListError">
      <template #default="{ data, index, style }">
        <el-cascader-node :key="data[index].uid" :node="data[index]" :menu-id="menuId" :style="style"
          @expand="handleExpand" @check="handleNodeCheck" :checked="isNodeChecked(data[index].uid)"
          :onVnodeMounted="() => logRenderNode(data[index].uid)" />
      </template>
    </FixedSizeList>
    <template v-else>
      <el-cascader-node v-for="node in nodes" :key="node.uid" :node="node" :menu-id="menuId" @expand="handleExpand"
        :onVnodeMounted="() => logRenderNode(node.uid)" />
    </template>
    <div v-if="isLoading" :class="ns.e('empty-text')">
      <el-icon size="14" :class="ns.is('loading')">
        <loading />
      </el-icon>
      {{ t('el.cascader.loading') }}
    </div>
    <div v-else-if="isEmpty" :class="ns.e('empty-text')">
      <slot name="empty">{{ t('el.cascader.noData') }}</slot>
    </div>
    <!-- eslint-disable-next-line vue/html-self-closing -->
    <svg v-else-if="panel?.isHoverMenu" ref="hoverZone" :class="ns.e('hover-zone')"></svg>
  </el-scrollbar>
</template>

<script lang="ts">
import { computed, defineComponent, getCurrentInstance, inject, ref, onBeforeUnmount, watch } from 'vue'
import ElScrollbar from '@element-plus/components/scrollbar'
import { useId, useLocale, useNamespace } from '@element-plus/hooks'
import { Loading } from '@element-plus/icons-vue'
import ElIcon from '@element-plus/components/icon'
import ElCascaderNode from './node.vue'
import ElCheckbox from '@element-plus/components/checkbox'
import { CASCADER_PANEL_INJECTION_KEY } from './types'
import { FixedSizeList } from '@element-plus/components/virtual-list'

import type { default as CascaderNode } from './node'
import type { PropType } from 'vue'
import type { Nullable } from '@element-plus/utils'
import type { CheckboxValueType } from '@element-plus/components/checkbox'

export default defineComponent({
  name: 'ElCascaderMenu',

  components: {
    Loading,
    ElIcon,
    ElScrollbar,
    ElCascaderNode,
    FixedSizeList,
    ElCheckbox,
  },

  props: {
    nodes: {
      type: Array as PropType<CascaderNode[]>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    modelValue: {
      type: Object as PropType<{ allSelected: boolean; exceptions: string[] }>,
      default: () => ({ allSelected: false, exceptions: [] }),
    },
  },

  setup(props, { emit }) {
    const instance = getCurrentInstance()!
    const ns = useNamespace('cascader-menu')

    const { t } = useLocale()
    const id = useId()
    let activeNode: Nullable<HTMLElement> = null
    let hoverTimer: Nullable<number> = null

    const panel = inject(CASCADER_PANEL_INJECTION_KEY)!

    const hoverZone = ref<null | SVGSVGElement>(null)
    const virtualListError = ref(false)

    // 全选性能优化相关状态
    const selectAllCache = ref<{
      allNodes: Set<string>
      checkedNodes: Set<string>
      lastUpdateTime: number
      nodeCount: number
      checkedCount: number
    }>({
      allNodes: new Set(),
      checkedNodes: new Set(),
      lastUpdateTime: 0,
      nodeCount: 0,
      checkedCount: 0
    })

    // 防抖相关状态
    const selectAllDebounceTimer = ref<number | null>(null)
    const isSelectAllProcessing = ref(false)

    const isEmpty = computed(() => !props.nodes.length)
    const isLoading = computed(() => !panel.initialLoaded)
    const menuId = computed(() => `${id.value}-${props.index}`)

    // 全选相关计算属性
    const showSelectAll = computed(() => panel.config.multiple && panel.config.showSelectAll)
    const selectAllText = computed(() => panel.config.selectAllText || t('el.cascader.selectAll'))

    // 计算全选状态 - 使用缓存优化
    const selectableNodes = computed(() =>
      props.nodes.filter(node => !node.isDisabled)
    )

    const checkedNodes = computed(() =>
      selectableNodes.value.filter(node => node.checked)
    )

    const isAllSelected = computed(() =>
      selectableNodes.value.length > 0 && checkedNodes.value.length === selectableNodes.value.length
    )

    const isIndeterminate = computed(() =>
      checkedNodes.value.length > 0 && checkedNodes.value.length < selectableNodes.value.length
    )

    const isAllDisabled = computed(() =>
      selectableNodes.value.length === 0
    )

    // 新增全选标记和例外集合
    const isAllSelectedFlag = ref(false)
    const checkedExceptions = ref(new Set<string>())

    // 判断节点是否选中
    function isNodeChecked(nodeUid: string) {
      if (isAllSelectedFlag.value) {
        return !checkedExceptions.value.has(nodeUid)
      } else {
        return checkedExceptions.value.has(nodeUid)
      }
    }

    // 全选/取消全选
    function handleSelectAll(checked: boolean) {
      const t0 = performance.now()
      isAllSelectedFlag.value = checked
      checkedExceptions.value.clear()
      emitSelected()
      const t1 = performance.now()
      console.log(`[Cascader] handleSelectAll(${checked}) 耗时: ${(t1 - t0).toFixed(2)}ms`)
    }

    // 单个节点选中/取消
    function handleNodeCheck(nodeUid: string, checked: boolean) {
      const t0 = performance.now()
      if (isAllSelectedFlag.value) {
        if (!checked) checkedExceptions.value.add(nodeUid)
        else checkedExceptions.value.delete(nodeUid)
      } else {
        if (checked) checkedExceptions.value.add(nodeUid)
        else checkedExceptions.value.delete(nodeUid)
      }
      emitSelected()
      const t1 = performance.now()
      console.log(`[Cascader] handleNodeCheck(${nodeUid}, ${checked}) 耗时: ${(t1 - t0).toFixed(2)}ms`)
    }

    // 获取所有选中节点的值
    function getSelectedNodeValues() {
      const t0 = performance.now()
      const result: (string | number)[] = []
      const collect = (nodes: CascaderNode[]) => {
        nodes.forEach(node => {
          if (!node.isDisabled && isNodeChecked(node.uid.toString())) {
            result.push(node.value)
          }
          if (node.children) collect(node.children)
        })
      }
      collect(props.nodes)
      const t1 = performance.now()
      console.log(`[Cascader] getSelectedNodeValues 耗时: ${(t1 - t0).toFixed(2)}ms, 选中节点数: ${result.length}`)
      return result
    }

    // 只 emit 一次事件，避免父组件频繁响应
    function emitSelected() {
      if (instance && instance.emit) {
        instance.emit('update:modelValue', {
          allSelected: isAllSelectedFlag.value,
          exceptions: Array.from(checkedExceptions.value)
        })
      }
    }

    // 更新全选缓存
    const updateSelectAllCache = () => {
      const now = Date.now()
      const cache = selectAllCache.value
      const currentNodes = selectableNodes.value

      // 如果节点数量没有变化且缓存时间在合理范围内，跳过更新
      if (cache.nodeCount === currentNodes.length &&
        now - cache.lastUpdateTime < 200) {
        return
      }

      const allNodeIds = new Set<string>()
      const checkedNodeIds = new Set<string>()
      let checkedCount = 0

      // 收集所有节点和已选中节点
      const collectNodes = (nodes: CascaderNode[]) => {
        nodes.forEach(node => {
          allNodeIds.add(node.uid.toString())
          if (node.checked) {
            checkedNodeIds.add(node.uid.toString())
            checkedCount++
          }
          if (node.children && node.children.length > 0) {
            collectNodes(node.children)
          }
        })
      }

      collectNodes(props.nodes)

      cache.allNodes = allNodeIds
      cache.checkedNodes = checkedNodeIds
      cache.lastUpdateTime = now
      cache.nodeCount = currentNodes.length
      cache.checkedCount = checkedCount
    }

    // 批量处理全选/取消全选，分批处理，batchSize=200，且只emit一次事件
    const batchSelectAll = async (checked: boolean) => {
      if (isAllDisabled.value || isSelectAllProcessing.value) return

      // 清除之前的防抖定时器
      if (selectAllDebounceTimer.value) {
        clearTimeout(selectAllDebounceTimer.value)
        selectAllDebounceTimer.value = null
      }

      // 设置防抖，避免快速重复点击
      selectAllDebounceTimer.value = window.setTimeout(async () => {
        isSelectAllProcessing.value = true
        try {
          const startTime = performance.now()
          updateSelectAllCache()
          const nodesToProcess = selectableNodes.value
          if (nodesToProcess.length === 0) return
          // 分批处理，batchSize=200
          const batchSize = 200
          const totalBatches = Math.ceil(nodesToProcess.length / batchSize)
          for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize
            const end = Math.min(start + batchSize, nodesToProcess.length)
            const batch = nodesToProcess.slice(start, end)
            // 只在最后一批 emit 事件，避免父组件频繁响应
            panel.batchCheckChange(batch, checked, i === totalBatches - 1)
            if (i < totalBatches - 1) {
              await new Promise(resolve => requestAnimationFrame(resolve))
            }
          }
          const endTime = performance.now()
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Cascader] 全选操作完成，处理 ${nodesToProcess.length} 个节点，耗时 ${(endTime - startTime).toFixed(2)}ms`)
          }
        } finally {
          isSelectAllProcessing.value = false
        }
      }, 50)
    }

    // 虚拟列表参数，可根据需要调整
    // 级联选择器菜单高度为 204px，减去上下内边距 12px (6px * 2)，如果有全选按钮再减去 34px
    const virtualListHeight = computed(() => {
      const baseHeight = 192
      return showSelectAll.value ? baseHeight - 34 : baseHeight
    })
    const virtualItemSize = 34

    const handleExpand = (e: MouseEvent) => {
      activeNode = e.target as HTMLElement
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!panel.isHoverMenu || !activeNode || !hoverZone.value) return

      if (activeNode.contains(e.target as HTMLElement)) {
        clearHoverTimer()

        const el = instance.vnode.el as HTMLElement
        const { left } = el.getBoundingClientRect()
        const { offsetWidth, offsetHeight } = el
        const startX = e.clientX - left
        const top = activeNode.offsetTop
        const bottom = top + activeNode.offsetHeight

        hoverZone.value.innerHTML = `
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${top} L${offsetWidth} 0 V${top} Z" />
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${bottom} L${offsetWidth} ${offsetHeight} V${bottom} Z" />
        `
      } else if (!hoverTimer) {
        hoverTimer = window.setTimeout(
          clearHoverZone,
          panel.config.hoverThreshold
        )
      }
    }

    const clearHoverTimer = () => {
      if (!hoverTimer) return
      clearTimeout(hoverTimer)
      hoverTimer = null
    }

    const clearHoverZone = () => {
      if (!hoverZone.value) return
      hoverZone.value.innerHTML = ''
      clearHoverTimer()
    }

    const handleVirtualListScroll = (e: Event) => {
      // 虚拟列表的滚动事件处理
      // 由于使用了外部的 el-scrollbar，这里主要用于同步滚动状态
      const target = e.target as HTMLElement
      if (target && panel.isHoverMenu) {
        // 在悬停菜单模式下，可能需要处理滚动相关的逻辑
        clearHoverZone()
      }
    }

    const handleVirtualListError = () => {
      // 虚拟列表出现错误时，降级到普通列表
      virtualListError.value = true
    }

    const handleSelectAllChange = (checked: CheckboxValueType) => {
      if (isAllDisabled.value) return

      batchSelectAll(checked as boolean)
    }

    // 清理定时器
    onBeforeUnmount(() => {
      if (selectAllDebounceTimer.value) {
        clearTimeout(selectAllDebounceTimer.value)
        selectAllDebounceTimer.value = null
      }
    })

    // 节点渲染性能打印（在模板渲染节点时调用）
    function logRenderNode(nodeUid: string) {
      // 这里只做简单打印，实际可统计渲染次数
      console.log(`[Cascader] 渲染节点: ${nodeUid}`)
    }

    // watch v-model 同步状态
    watch(
      () => props.modelValue,
      (val) => {
        if (val && typeof val === 'object') {
          isAllSelectedFlag.value = !!val.allSelected
          checkedExceptions.value = new Set(val.exceptions || [])
        }
      },
      { immediate: true }
    )

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
    }
  },
})
</script>
