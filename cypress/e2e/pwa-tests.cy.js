import 'cypress-axe';
it('has no accessibility violations', () => {
  cy.visit('/');
  cy.injectAxe();
  cy.checkA11y();
});

it('displays homepage content', () => {
  cy.visit('/');
  cy.contains("Välkommen till WPK:s hemsida").should('be.visible');
});
