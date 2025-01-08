import { AlertState, useAlertStore } from "@/stores/alert-store";

const ALERT_DISPLAY_TIME = 4000;

export enum AlertType {
  Error,
  Info,
  Success,
}

export class Alert {
  constructor(
    public message: string,
    public alertType: AlertType,
    public id: string
  ) {}
}

export function setAlert(message: Error | string, isSuccess?: boolean) {
  useAlertStore.getState().mutateState((alertState) => {
    if (message instanceof Error) console.trace(message);
    const text = message instanceof Error ? message.message : message;
    let alertType;
    if (message instanceof Error) alertType = AlertType.Error;
    else if (isSuccess) alertType = AlertType.Success;
    else alertType = AlertType.Info;

    let newAlert = new Alert(text, alertType, alertState.lastAlertId.toString());

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
