/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

const stripe = Stripe(
  "pk_test_51MyB5DGddkqJyoJGrHKO6nZCuhHYAhTfHNaLlI4GhI1hZ5IX2xEsdyzpvFBNXivddAGwDoZvNYukGuJYOsrbiFDq00D8YVzJqM"
);

export const bookTour = async (tourId, startDate) => {
  try {
    // 1) Get checkout session from API
    const session = await axios({
      url: `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}/${startDate}`,
    });

    console.log(session);

    // 2) Create checkout form + crange credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.error(error);
    showAlert("error", error.response.data.message);

    window.setTimeout(() => {
      location.reload();
    }, 2000);
  }
};
