import type { Session } from '../../src/types/session'

const vueSession: Session = {
  id: 1,
  topic: 'Vue reactivity',
  durationMinutes: 25,
}

function mockSessionList(records: Session[]) {
  cy.intercept({ method: 'GET', pathname: '/api/sessions' }, (req) => {
    const query = new URL(req.url).searchParams
    const page = Number(query.get('page') ?? '1')
    const limit = Number(query.get('limit') ?? '2')
    const search = (query.get('q') ?? '').trim().toLowerCase()

    const matches = records.filter((session) => session.topic.toLowerCase().includes(search))

    const start = (page - 1) * limit

    req.reply({
      statusCode: 200,
      body: {
        data: matches.slice(start, start + limit),
        meta: {
          total: matches.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(matches.length / limit)),
        },
      },
    })
  }).as('loadSessions')
}

describe('Practice sessions', () => {
  it('adds a session through the form and reloads the page of results', () => {
    const records = [vueSession]
    const createdSession: Session = {
      id: 2,
      topic: 'Learning Cypress',
      durationMinutes: 20,
    }

    mockSessionList(records)

    cy.intercept('POST', '/api/sessions', (req) => {
      records.push(createdSession)

      req.reply({
        statusCode: 201,
        body: { data: createdSession },
      })
    }).as('createSession')

    cy.visit('/')
    cy.wait('@loadSessions')

    cy.get('#session-topic').type('Learning Cypress')
    cy.get('#session-duration').clear().type('20')
    cy.contains('button', 'Add session').click()

    cy.wait('@createSession').its('request.body').should('deep.equal', {
      topic: 'Learning Cypress',
      durationMinutes: 20,
    })

    cy.wait('@loadSessions').its('response.body.meta.total').should('eq', 2)

    cy.contains('li', 'Learning Cypress').should('be.visible').and('contain.text', '20 minutes')

    cy.get('#session-topic').should('have.value', '')
    cy.get('#session-duration').should('have.value', '25')
  })

  it('shows an API error and keeps the form input', () => {
    mockSessionList([])

    cy.intercept('POST', '/api/sessions', {
      statusCode: 400,
      body: { message: 'Topic is required' },
    }).as('createSession')

    cy.visit('/')
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
    mockSessionList([])

    const confirmStub = cy.stub().as('leaveConfirmation')
    confirmStub.onFirstCall().returns(false)
    confirmStub.onSecondCall().returns(true)

    cy.on('window:confirm', confirmStub)

    cy.visit('/')
    cy.wait('@loadSessions')

    cy.get('#session-topic').type('My unfinished session')
    cy.get('nav').contains('a', 'About').click()

    cy.get('@leaveConfirmation')
      .should('have.been.calledOnce')
      .and('have.been.calledWith', 'You have unsaved changes. Leave this page and discard them?')

    cy.location('pathname').should('eq', '/')
    cy.get('#session-topic').should('have.value', 'My unfinished session')

    cy.get('nav').contains('a', 'About').click()

    cy.location('pathname').should('eq', '/about')
    cy.get('@leaveConfirmation').should('have.been.calledTwice')

    cy.get('nav').contains('a', 'Dashboard').click()
    cy.wait('@loadSessions')

    cy.get('#session-topic').should('have.value', '')
  })

  it('clears the search and returns focus to the input', () => {
    mockSessionList([vueSession])

    cy.visit('/')
    cy.wait('@loadSessions')

    cy.get('input[type="search"]').type('vue')
    cy.location('search').should('eq', '?q=vue')

    cy.contains('button', 'Clear search').click()

    cy.get('input[type="search"]').should('have.value', '').and('be.focused')
    cy.location('search').should('eq', '')
  })

  it('focuses search with / and allows slashes while typing', () => {
    mockSessionList([vueSession])

    cy.visit('/')
    cy.wait('@loadSessions')
    cy.contains('li', vueSession.topic).should('be.visible')

    cy.get('h1.dashboard-title').click()
    cy.get('body').type('/')

    cy.get('input[type="search"]').should('be.focused').and('have.value', '')

    cy.get('input[type="search"]').type('vue/reactivity')

    cy.get('input[type="search"]').should('be.focused').and('have.value', 'vue/reactivity')
  })

  it('waits 300 ms before searching and uses the latest query', () => {
    mockSessionList([vueSession])

    cy.visit('/')
    cy.wait('@loadSessions')

    cy.clock(0, ['setTimeout', 'clearTimeout'])

    cy.get('input[type="search"]').type('vue', { delay: 0 })
    cy.location('search').should('eq', '?q=vue')

    cy.get('@loadSessions.all').should('have.length', 1)

    cy.tick(299)
    cy.get('@loadSessions.all').should('have.length', 1)

    cy.tick(1)
    cy.wait('@loadSessions').its('request.url').should('include', 'q=vue')
    cy.get('@loadSessions.all').should('have.length', 2)
  })
})
