import { AlertState } from "@/stores/alert-store";

const ALERT_DISPLAY_TIME = 4000;

enum AlertType {
  Error,
  // Success,
}

export class Alert {
  constructor(
    public message: string,
    public alertType: AlertType,
    public id: string
  ) {}
}

export function setAlert(
  mutateAlertStore: (fn: (state: AlertState) => void) => void,
  message: string
) {
  mutateAlertStore((alertState) => {
    console.log("alert set: ", message);
    console.trace();
    let newAlert = new Alert(message, AlertType.Error, alertState.lastAlertId.toString());

    alertState.alerts.push(newAlert);
    alertState.lastAlertId += 1;
    setTimeout(() => {
      mutateAlertStore((alertState) => {
        removeAlert(alertState, newAlert.id);
      });
    }, ALERT_DISPLAY_TIME);
  });
}

export function removeAlert(alertState: AlertState, id: string) {
  const indicesToRemove: number[] = [];
  alertState.alerts.forEach((alert, index) => {
    if (id === alert.id) {
      indicesToRemove.push(index);
    }
  });
  indicesToRemove.forEach((index) => {
    alertState.alerts.splice(index, 1);
  });
}
