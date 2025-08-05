document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('');
  const { country_code } = await res.json();

  const shippingSelect = document.querySelector('select[name="shipping[country]"]');
  const billingSelect = document.querySelector('select[name="billing[country]"]');
  const phoneSelect = document.querySelector('select[name="phone[country]"]');
  const phoneInput = document.querySelector('input[name="shipping[phone]"]');

  // initialize Choices for each select
  if (window.Choices) {
    window.Choices(shippingSelect);
    window.Choices(billingSelect);
    window.Choices(phoneSelect);
  }

  // initialize phone input
  if (window.intlTelInput && phoneInput) {
    window.intlTelInput(phoneInput, { initialCountry: country_code.toLowerCase() });
  }

  // set selected values
  if (shippingSelect) shippingSelect.value = country_code;
  if (billingSelect) billingSelect.value = country_code;
  if (phoneSelect) phoneSelect.value = `${country_code}|+1`;
});

export default {};
