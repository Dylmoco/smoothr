(async function () {
  // Get store_id - replace 'your-store-id' with your actual store ID from Supabase or dashboard
  const storeId = 'your-store-id';

  // Fetch the tokenization key from backend
  const keyResponse = await fetch('/api/get-payment-key?store_id=' + storeId);
  const { key: tokenizationKey } = await keyResponse.json();

  if (!tokenizationKey) {
    console.error('No payment key');
    return;
  }

  // Load CollectJS script dynamically
  const script = document.createElement('script');
  script.src = 'https://secure.nmi.com/token/Collect.js';
  script.setAttribute('data-tokenization-key', tokenizationKey);
  script.async = true;
  document.head.appendChild(script);

  script.onload = function () {
    // Configure inline payment fields
    CollectJS.configure({
      variant: 'inline',
      styleSnippets: {
        '*': {
          'font-family': '16px Arial',
          // add your styles
        }
      },
      fields: {
        ccnumber: {
          selector: '#smoothr-cc-number', // replace with your field ID in Webflow
          placeholder: 'Card Number'
        },
        ccexp: {
          selector: '#smoothr-cc-exp',
          placeholder: 'MM/YY'
        },
        cvv: {
          selector: '#smoothr-cc-cvv',
          placeholder: 'CVV'
        }
      },
      invalidCallback: function (data) {
        console.log('Invalid field', data);
      },
      validCallback: function (data) {
        console.log('Valid field', data);
      }
    });
  };

  // Pay button listener
  const payButton = document.querySelector('[data-smoothr-pay]');
  payButton.addEventListener('click', async (e) => {
    e.preventDefault();

    CollectJS.createToken(function (response) {
      if (response.token) {
        // Send token and store_id to backend
        fetch('/api/checkout/nmi', {
          method: 'POST',
          headers: JSON {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: response.token,
            store_id: {}, // add other fields if needed
            store_id: storeId // This is the missing store_id
          })
        }).then(res => {
          if (!res.ok) {
            console.error('Payment error', res.status);
          } else {
            console.log('Payment sent');
            // Handle success, e.g. redirect
          }
        }).catch(error => console.error('Error', error));
      } else {
        console.error('Token error', response);
      }
    });
  });
})();