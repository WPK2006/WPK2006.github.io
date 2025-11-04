// cypress/e2e/accessibility.cy.js
describe('Accessibility with axe-core', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
    cy.wait(100); // ge layouten tid att bli klar
  });

  it('no a11y violations on load', () => {
    cy.checkA11y(undefined, {
      // valfritt: begränsa till seriösa/critical findings
      includedImpacts: ['serious', 'critical'],
      rules: {
        // skippa "region" om du saknar <main>/<nav>/<header> landmarks
        // 'region': { enabled: false },
      }
    });
  });

  it('no a11y violations in main content', () => {
    cy.checkA11y('main', {
      includedImpacts: ['serious', 'critical'],
    });
  });

  it('links are accessible (names etc.)', () => {
    // Testa specifik regel för länk-namn i hela dokumentet
    cy.checkA11y(undefined, {
      runOnly: {
        type: 'rule',
        values: ['link-name'] // alternativt 'aria-valid-attr', 'aria-roles'
      }
    });
  });

  it('proper color contrast (strict)', () => {
    cy.checkA11y(undefined, {
      runOnly: { type: 'rule', values: ['color-contrast'] },
      includedImpacts: ['serious', 'critical']
    });
  });

  it('heading order makes sense', () => {
    cy.checkA11y('body', {
      runOnly: { type: 'rule', values: ['heading-order'] }
    });
  });
});
