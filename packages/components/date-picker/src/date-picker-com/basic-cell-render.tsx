import { defineComponent, inject, renderSlot, ref } from 'vue'
import { useNamespace } from '@element-plus/hooks'
import { ROOT_PICKER_INJECTION_KEY } from '../constants'
import { basicCellProps } from '../props/basic-cell'

export default defineComponent({
  name: 'ElDatePickerCell',
  props: basicCellProps,
  setup(props) {
    const ns = useNamespace('date-table-cell')
    const { slots } = inject(ROOT_PICKER_INJECTION_KEY)!
    const isHover = ref(false)

    return () => {
      const { cell } = props as any

      return (
        <div
          class={ns.b()}
          onMouseenter={() => (isHover.value = true)}
          onMouseleave={() => (isHover.value = false)}
        >
          {renderSlot(
            slots,
            'default',
            { ...cell, isHover: isHover.value },
            () => [
              <span
                class={ns.e('text')}
                style={
                  // 只有在还没有任何已选值时，第一次 hover 才使用这套背景/文字色
                  !cell?.hasValue && isHover.value
                    ? 'background: #F5F5F5;color: #0C0C0C'
                    : undefined
                }
              >
                {cell?.renderText ?? cell?.text}
              </span>,
            ]
          )}
        </div>
      )
    }
  },
})
