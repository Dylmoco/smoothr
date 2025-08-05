export default function collectFormFields(q) {
  return {
    emailField: q('[data-smoothr-email]'),
    firstName: q('[data-smoothr-first-name]'),
    lastName: q('[data-smoothr-last-name]'),
    ship_line1: q('[data-smoothr-ship-line1]'),
    ship_line2: q('[data-smoothr-ship-line2]'),
    ship_city: q('[data-smoothr-ship-city]'),
    ship_state: q('[data-smoothr-ship-state]'),
    ship_postal: q('[data-smoothr-ship-postal]'),
    ship_country: q('[data-smoothr-ship-country]'),
    bill_first_name: q('[data-smoothr-bill-first-name]'),
    bill_last_name: q('[data-smoothr-bill-last-name]'),
    bill_line1: q('[data-smoothr-bill-line1]'),
    bill_line2: q('[data-smoothr-bill-line2]'),
    bill_city: q('[data-smoothr-bill-city]'),
    bill_state: q('[data-smoothr-bill-state]'),
    bill_postal: q('[data-smoothr-bill-postal]'),
    bill_country: q('[data-smoothr-bill-country]')
  };
}
