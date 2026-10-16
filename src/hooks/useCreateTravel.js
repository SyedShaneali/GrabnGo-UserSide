import { useState } from "react";
import { createTravel } from "../api/TravelApi";

export function useSubmitTravel() {
  const [submitting, setSubmitting] = useState(false);

  const submitTravel = async (payload) => {
    setSubmitting(true);
    try {
      const data = await createTravel(payload);
      return data;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong creating the travel";
      throw new Error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return { submitTravel, submitting };
}