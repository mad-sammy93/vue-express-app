describe('Practice sessions', () => {
  it('adds a session through the form', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/sessions' },
      {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              topic: 'Vue reactivity',
              durationMinutes: 25,
            },
          ],
        },
      },
    ).as('loadSessions')

    cy.intercept('POST', '/api/sessions', {
      statusCode: 201,
      body: {
        data: {
          id: 2,
          topic: 'Learning Cypress',
          durationMinutes: 20,
        },
      },
    }).as('createSession')

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('skill-lab-search')
      },
    })

    cy.wait('@loadSessions')

    cy.contains('li', 'Vue reactivity').should('be.visible')

    cy.get('#session-topic').type('Learning Cypress')
    cy.get('#session-duration').clear().type('20')

    cy.contains('button', 'Add session').click()

    cy.wait('@createSession').its('request.body').should('deep.equal', {
      topic: 'Learning Cypress',
      durationMinutes: 20,
    })

    cy.contains('li', 'Learning Cypress').should('be.visible').and('contain.text', '20 minutes')

    cy.get('#session-topic').should('have.value', '')
    cy.get('#session-duration').should('have.value', '25')
  })

  it('shows an API error and keeps the form input', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/sessions' },
      {
        statusCode: 200,
        body: {
          data: [],
        },
      },
    ).as('loadSessions')

    cy.intercept('POST', '/api/sessions', {
      statusCode: 400,
      body: {
        message: 'Topic is required',
      },
    }).as('createSession')

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('skill-lab-search')
      },
    })

    cy.wait('@loadSessions')

    cy.get('#session-topic').type('Learning Cypress')
    cy.get('#session-duration').clear().type('20')

    cy.contains('button', 'Add session').click()

    cy.wait('@createSession').its('response.statusCode').should('eq', 400)

    cy.contains('[role="alert"]', 'Topic is required').should('be.visible')

    cy.get('#session-topic').should('have.value', 'Learning Cypress')

    cy.get('#session-duration').should('have.value', '20')

    cy.contains('li', 'Learning Cypress').should('not.exist')

    cy.contains('button', 'Add session').should('be.enabled')
  })

  it('protects an unsaved draft when navigating away', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/sessions' },
      {
        statusCode: 200,
        body: { data: [] },
      },
    ).as('loadSessions')

    const confirmStub = cy.stub().as('leaveConfirmation')

    confirmStub.onFirstCall().returns(false)
    confirmStub.onSecondCall().returns(true)

    cy.on('window:confirm', confirmStub)

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('skill-lab-search')
      },
    })

    cy.wait('@loadSessions')

    cy.get('#session-topic').type('My unfinished session')

    // First attempt: choose Cancel.
    cy.get('nav').contains('a', 'About').click()

    cy.get('@leaveConfirmation')
      .should('have.been.calledOnce')
      .and('have.been.calledWith', 'You have unsaved changes. Leave this page and discard them?')

    cy.location('pathname').should('eq', '/')

    cy.get('#session-topic').should('have.value', 'My unfinished session')

    // Second attempt: choose OK.
    cy.get('nav').contains('a', 'About').click()

    cy.location('pathname').should('eq', '/about')

    cy.get('@leaveConfirmation').should('have.been.calledTwice')

    // Returning creates a fresh dashboard without the discarded draft.
    cy.get('nav').contains('a', 'Dashboard').click()

    cy.wait('@loadSessions')

    cy.get('#session-topic').should('have.value', '')
  })

  it('clears the search and returns focus to the input', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/sessions' },
      {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              topic: 'Vue reactivity',
              durationMinutes: 25,
            },
          ],
        },
      },
    ).as('loadSessions')

    cy.visit('/')
    cy.wait('@loadSessions')

    cy.get('input[type="search"]').type('vue')

    cy.contains('button', 'Clear search').click()

    cy.get('input[type="search"]').should('have.value', '').and('be.focused')

    cy.location('search').should('eq', '')
  })

  it('focuses search with / and allows slashes while typing', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/sessions' },
      {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              topic: 'Vue reactivity',
              durationMinutes: 25,
            },
          ],
        },
      },
    ).as('loadSessions')

    cy.visit('/')
    cy.wait('@loadSessions')

    // Pressing / outside an input focuses search.
    cy.get('h1.dashboard-title').click()
    cy.get('body').type('/')

    cy.get('input[type="search"]').should('be.focused').and('have.value', '')

    // Inside the input, / remains ordinary text.
    cy.get('input[type="search"]').type('vue/reactivity')

    cy.get('input[type="search"]').should('be.focused').and('have.value', 'vue/reactivity')
  })

  it('waits 300 ms before searching and uses the latest query', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/sessions' },
      {
        statusCode: 200,
        body: {
          data: [
            {
              id: 1,
              topic: 'Vue reactivity',
              durationMinutes: 25,
            },
          ],
        },
      },
    ).as('loadSessions')

    cy.visit('/')
    cy.wait('@loadSessions')

    // Control timeout functions after the initial load.
    cy.clock(0, ['setTimeout', 'clearTimeout'])

    cy.get('input[type="search"]').type('vue', { delay: 0 })

    cy.location('search').should('eq', '?q=vue')

    // Only the initial request has happened.
    cy.get('@loadSessions.all').should('have.length', 1)

    cy.tick(299)

    cy.get('@loadSessions.all').should('have.length', 1)

    // Reach the debounce deadline.
    cy.tick(1)

    cy.wait('@loadSessions').its('request.url').should('include', 'q=vue')

    cy.get('@loadSessions.all').should('have.length', 2)
  })
})
