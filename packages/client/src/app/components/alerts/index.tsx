import { AlertState, useAlertStore } from "@/stores/alert-store";

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

export function setAlert(message: Error | string) {
  useAlertStore.getState().mutateState((alertState) => {
    console.info("alert set: ", message);
    if (message instanceof Error) console.trace(message);
    const text = message instanceof Error ? message.message : message;
    // console.trace();
    let newAlert = new Alert(text, AlertType.Error, alertState.lastAlertId.toString());

    alertState.alerts.push(newAlert);
    alertState.lastAlertId += 1;
    setTimeout(() => {
      useAlertStore.getState().mutateState((alertState) => {
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
