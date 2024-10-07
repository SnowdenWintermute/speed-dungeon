import { HttpRequestTracker } from "@/stores/http-request-store";
import { useState, useEffect } from "react";

export default function useHttpResponseErrors(
  httpResponseTrackerOption: undefined | HttpRequestTracker
): [
  { [key: string]: string },
  React.Dispatch<React.SetStateAction<{ [key: string]: string }>>,
  string[],
  React.Dispatch<React.SetStateAction<string[]>>,
] {
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [nonFieldErrors, setNonFieldErrors] = useState<string[]>([]);

  useEffect(() => {
    const newFieldErrors: { [key: string]: string } = {};
    const newNonFieldErrors: string[] = [];
    if (!httpResponseTrackerOption?.errors) return;
    httpResponseTrackerOption.errors.forEach((error) => {
      if (!error.field) {
        newNonFieldErrors.push(error.message);
      } else {
        newFieldErrors[error.field] = error.message;
      }
    });
    setFieldErrors(newFieldErrors);
    setNonFieldErrors(newNonFieldErrors);
  }, [httpResponseTrackerOption?.errors]);

  return [fieldErrors, setFieldErrors, nonFieldErrors, setNonFieldErrors];
}
