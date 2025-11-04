// cypress/e2e/homepage.cy.js
describe('WPK Homepage', () => {
  beforeEach(() => {
    // Se till att du har baseUrl satt i cypress.config.* till din dev-server eller Pages-preview
    cy.visit('/');
  });

  it('laddar startsidan', () => {
    cy.get('h1.title').should('contain', 'Välkommen till WPK:s hemsida');
  });

  it('har korrekt <title>', () => {
    cy.title().should('include', 'WPK – Hemsida');
  });

  it('visar profil-länk', () => {
    cy.get('a[href*="github.com/WPK2006"]')
      .should('be.visible')
      .and('contain', 'Öppna profil');
  });

  it('visar schema-länk', () => {
    cy.get('a[href*="tcstenungsund.github.io"]')
      .should('be.visible')
      .and('contain', 'Öppna schema');
  });

  it('länkarna har rätt attribut', () => {
    cy.get('a[href*="github.com/WPK2006"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel')
      .and('match', /noopener/i);
  });

  it('visar footer', () => {
    cy.contains('© 2025 WPK2006').should('be.visible');
  });

  it('är responsiv', () => {
    cy.viewport('iphone-x');
    cy.get('h1.title').should('be.visible');

    cy.viewport('ipad-2');
    cy.get('h1.title').should('be.visible');

    cy.viewport(1280, 800);
    cy.get('h1.title').should('be.visible');
  });

  it('registrerar service worker (om möjligt)', () => {
    cy.window().then((win) => {
      // SW kräver HTTPS eller localhost. Skippa testet om miljön inte stödjer det.
      const isSecure = win.location.protocol === 'https:' || win.location.hostname === 'localhost';
      if (!('serviceWorker' in win.navigator) || !isSecure) {
        cy.log('Skipping SW check (not secure context or no SW support)');
        return;
      }
      // Vänta lite så registreringen hinner ske efter onload
      cy.wrap(null).then({ timeout: 8000 }, async () => {
        const regs = await win.navigator.serviceWorker.getRegistrations();
        expect(regs.length, 'har minst en SW-registrering').to.be.greaterThan(0);
      });
    });
  });
});
