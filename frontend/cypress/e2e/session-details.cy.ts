describe('Session details', () => {
  it('displays the requested session', () => {
    cy.intercept('GET', '/api/sessions/2', {
      statusCode: 200,
      body: {
        data: {
          id: 2,
          topic: 'Props and events',
          durationMinutes: 30,
        },
      },
    }).as('loadSession')

    cy.visit('/sessions/2')

    cy.wait('@loadSession')

    cy.get('article').within(() => {
      cy.get('h2').should('have.text', 'Props and events')
      cy.contains('Duration: 30 minutes').should('be.visible')
      cy.contains('Session ID: 2').should('be.visible')
    })

    cy.get('[role="alert"]').should('not.exist')
    cy.contains('Loading session...').should('not.exist')
  })

  it('shows an error when the session does not exist', () => {
    cy.intercept('GET', '/api/sessions/999', {
      statusCode: 404,
      body: {
        message: 'Session not found',
      },
    }).as('loadMissingSession')

    cy.visit('/sessions/999')

    cy.wait('@loadMissingSession')

    cy.get('[role="alert"]').should('be.visible').and('have.text', 'Session not found')

    cy.get('article').should('not.exist')
    cy.contains('Loading session...').should('not.exist')
  })

  it('shows an error when invalid duration type is provided', () => {
    cy.intercept('GET', '/api/sessions/2', {
      statusCode: 200,
      body: {
        data: {
          id: 2,
          topic: 'Props and events',
          durationMinutes: '30',
        },
      },
    }).as('loadInvalidSessionData')

    cy.visit('/sessions/2')
    cy.wait('@loadInvalidSessionData')

    cy.get('[role="alert"]')
      .should('be.visible')
      .and('have.text', 'The server returned invalid session data')

    cy.get('article').should('not.exist')
    cy.contains('Loading session...').should('not.exist')
  })
})
