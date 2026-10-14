import { useState } from "react";
import { submitTravelVerification } from "../api/TravelApi";

export function useSubmitTravelVerification() {
  const [submitting, setSubmitting] = useState(false);

  const submitVerification = async (travelId, payload) => {
    setSubmitting(true);
    try {
      const data = await submitTravelVerification(travelId, payload);
      return data;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong submitting your documents";
      throw new Error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return { submitVerification, submitting };
}