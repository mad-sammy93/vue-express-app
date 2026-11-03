import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PaginationControls from '../PaginationControls.vue'

describe('PaginationControls', () => {
  it('disables Previous on page one and emits the next page', async () => {
    const wrapper = mount(PaginationControls, {
      props: {
        page: 1,
        totalPages: 3,
      },
    })

    expect(wrapper.get('[data-test="previous-page"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="next-page"]').trigger('click')

    expect(wrapper.emitted('update:page')).toEqual([[2]])

    wrapper.unmount()
  })

  it('renders a new page supplied by the parent', async () => {
    const wrapper = mount(PaginationControls, {
      props: {
        page: 1,
        totalPages: 3,
      },
    })

    await wrapper.setProps({ page: 3 })

    expect(wrapper.text()).toContain('Page 3 of 3')

    expect(wrapper.get('[data-test="next-page"]').attributes('disabled')).toBeDefined()

    expect(wrapper.get('[data-test="previous-page"]').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('disables every button when disabled is true', () => {
    const wrapper = mount(PaginationControls, {
      props: {
        page: 2,
        totalPages: 3,
        disabled: true,
      },
    })

    for (const button of wrapper.findAll('button')) {
      expect(button.attributes('disabled')).toBeDefined()
    }

    wrapper.unmount()
  })

  it('emits page one when First page is clicked', async () => {
    const wrapper = mount(PaginationControls, {
      props: {
        page: 3,
        totalPages: 5,
      },
    })

    await wrapper.get('[data-test="first-page"]').trigger('click')

    expect(wrapper.emitted('update:page')).toEqual([[1]])

    wrapper.unmount()
  })
})
