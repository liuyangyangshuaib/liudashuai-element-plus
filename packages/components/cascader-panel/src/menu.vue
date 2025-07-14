<template>
  <el-scrollbar :key="menuId" tag="ul" role="menu" :class="ns.b()" :wrap-class="ns.e('wrap')"
    :view-class="[ns.e('list'), ns.is('empty', isEmpty)]" @mousemove="handleMouseMove" @mouseleave="clearHoverZone">
    <!-- 全选按钮 -->
    <div v-if="showSelectAll" :class="ns.e('select-all')">
      <el-checkbox :model-value="isAllSelected" :indeterminate="isIndeterminate" @click.stop
        @update:model-value="handleSelectAllChange">
        {{ selectAllText }}
      </el-checkbox>
    </div>

    <!-- :onVnodeMounted 为什么要添加这个代码? 
     1. index的addNodeByValue 和removeNodeByValue 中 使用的是docheck 
     docheck 并不会触发数据的响应式依赖 vue监听不到  所以在这里添加钩子 搭配list中的 menus.value = [...menus.value] 
     能强制更新视图 但是 性能会下降 -->
    <el-cascader-node v-for="node in nodes" :key="node.uid" :node="node" :menu-id="menuId" @expand="handleExpand"
      :onVnodeMounted="() => { }" />
    <div v-if="isLoading" :class="ns.e('empty-text')">
      <el-icon size="14" :class="ns.is('loading')">
        <loading />
      </el-icon>
      {{ t('el.cascader.loading') }}
    </div>
    <!-- <el-cascader-node v-for="node in nodes" :key="node.uid" :node="node" :menu-id="menuId" @expand="handleExpand"
        :onVnodeMounted="() => logRenderNode(node.uid)" /> -->
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
import { computed, defineComponent, getCurrentInstance, inject, ref, onBeforeUnmount, watch, defineExpose } from 'vue'
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

  setup(props) {
    const instance = getCurrentInstance()!
    const ns = useNamespace('cascader-menu')

    const { t } = useLocale()
    const id = useId()
    let activeNode: Nullable<HTMLElement> = null
    let hoverTimer: Nullable<number> = null

    const panel = inject(CASCADER_PANEL_INJECTION_KEY)!

    const hoverZone = ref<null | SVGSVGElement>(null)

    const isEmpty = computed(() => !props.nodes.length)
    const isLoading = computed(() => !panel.initialLoaded)
    const menuId = computed(() => `${id.value}-${props.index}`)

    const handleExpand = (e: MouseEvent) => {
      console.log(e.target, 'e.target')
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



    // 全选相关计算属性
    const showSelectAll = computed(() => panel.config.multiple && panel.config.showSelectAll)
    const selectAllText = computed(() => panel.config.selectAllText || t('el.cascader.selectAll'))

    const batchSelectAll = (checked: boolean) => {
      const nodes = props.nodes
      for (const node of nodes) {
        node.doCheck(checked)
      }
    }
    const isAllSelected = computed(() => {
      return props.nodes.every(node => node.checked)
    })
    const isIndeterminate = computed(() => {
      return props.nodes.some(node => node.checked) && !props.nodes.every(node => node.checked)
    })
    const handleSelectAllChange = (checked: CheckboxValueType) => {
      batchSelectAll(checked as boolean)
    }



    // function logRenderNode(nodeUid: string) {
    // 这里只做简单打印，实际可统计渲染次数
    // console.log(`[Cascader] 渲染节点: ${nodeUid}`)
    // }

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
      selectAllText,
      // logRenderNode
    }
  },
})
</script>
