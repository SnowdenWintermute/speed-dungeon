import { setAlert } from "@/app/components/alerts";
import { useAlertStore } from "@/stores/alert-store";
import { HttpRequestTracker } from "@/stores/http-request-store";
import { useState, useEffect } from "react";

export default function useFormFieldErrors(
  httpResponseTrackerOption: undefined | HttpRequestTracker
): [{ [key: string]: string }, React.Dispatch<React.SetStateAction<{ [key: string]: string }>>] {
  const mutateAlertStore = useAlertStore().mutateState;
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const newFieldErrors: { [key: string]: string } = {};
    if (!httpResponseTrackerOption?.errors) return;
    httpResponseTrackerOption.errors.forEach((error) => {
      if (!error.field) {
        setAlert(mutateAlertStore, error.message);
      } else {
        newFieldErrors[error.field] = error.message;
      }
    });
    setFieldErrors(newFieldErrors);
  }, [httpResponseTrackerOption?.errors]);

  return [fieldErrors, setFieldErrors];
}
