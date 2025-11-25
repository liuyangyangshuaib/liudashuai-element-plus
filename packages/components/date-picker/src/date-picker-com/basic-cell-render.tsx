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
      const { cell } = props

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
                  isHover.value ? 'border: 1px solid #3169E9' : undefined
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
