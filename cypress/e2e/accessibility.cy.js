describe('Accessibility with axe-core', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.document().its('readyState').should('eq', 'complete');
    cy.injectAxe();
    cy.wait(100); // ge layout/typsnitt tid
  });

  it('no serious/critical a11y issues on load', () => {
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] });
  });

  it('no a11y issues in <main>', () => {
    // Säkerställ att <main> finns innan vi kör axe på den
    cy.get('main').then(($main) => {
      cy.checkA11y($main, { includedImpacts: ['serious', 'critical'] });
    });
  });

  it('links have accessible names', () => {
    cy.checkA11y(undefined, { runOnly: { type: 'rule', values: ['link-name'] } });
  });

  it('proper color contrast', () => {
    cy.checkA11y(undefined, { runOnly: { type: 'rule', values: ['color-contrast'] } });
  });

  it('heading order makes sense', () => {
    cy.checkA11y('body', { runOnly: { type: 'rule', values: ['heading-order'] } });
  });
});
