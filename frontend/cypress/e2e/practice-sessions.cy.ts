describe('Practice sessions', () => {
  it('adds a session through the form', () => {
    cy.intercept('GET', '/api/sessions', {
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
    }).as('loadSessions')

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
    cy.intercept('GET', '/api/sessions', {
      statusCode: 200,
      body: {
        data: [],
      },
    }).as('loadSessions')

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
})
