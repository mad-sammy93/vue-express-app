import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'
import DashboardView from '../views/DashboardView.vue'
import AboutView from '../views/AboutView.vue'

describe('App', () => {
  it('renders the navigation and dashboard', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: DashboardView },
        { path: '/about', component: AboutView },
      ],
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    expect(wrapper.get('nav').text()).toContain('Dashboard')
    expect(wrapper.get('nav').text()).toContain('About')
    expect(wrapper.get('h1').text()).toBe('Vue Skill Lab')

    wrapper.unmount()
  })
})
