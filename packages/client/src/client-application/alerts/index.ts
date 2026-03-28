import { makeAutoObservable, makeObservable } from "mobx";

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

export class AlertsService {
  readonly alerts: Alert[] = [];
  private lastAlertId = 0;
  constructor() {
    makeAutoObservable(this);
  }

  setAlert(message: Error | string, isSuccess?: boolean) {
    console.info(`alert: ${message}`);
    if (message instanceof Error) {
      console.trace(message);
    }

    const text = message instanceof Error ? message.message : message;

    const newAlert = new Alert(
      text,
      this.getAlertType(message, isSuccess),
      this.lastAlertId.toString()
    );

    this.alerts.push(newAlert);
    this.lastAlertId += 1;
    setTimeout(() => {
      this.removeAlert(newAlert.id);
    }, ALERT_DISPLAY_TIME);
  }

  removeAlert(id: string) {
    const indicesToRemove: number[] = [];
    this.alerts.forEach((alert, index) => {
      if (id === alert.id) {
        indicesToRemove.push(index);
      }
    });
    indicesToRemove.forEach((index) => {
      this.alerts.splice(index, 1);
    });
  }

  private getAlertType(message: Error | string, isSuccess?: boolean) {
    if (message instanceof Error) {
      return AlertType.Error;
    } else if (isSuccess) {
      return AlertType.Success;
    } else {
      return AlertType.Info;
    }
  }
}
