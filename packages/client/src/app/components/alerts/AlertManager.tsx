import { useAlertStore } from "@/stores/alert-store";
import React, { ReactNode } from "react";
import { AlertType, removeAlert } from ".";
import { ZIndexLayers } from "@/app/z-index-layers";
import SuccessIcon from "../../../../public/img/alert-icons/success.svg";
import DangerIcon from "../../../../public/img/alert-icons/danger.svg";

const ALERT_ICONS_BY_TYPE: Record<AlertType, ReactNode> = {
  [AlertType.Error]: <DangerIcon className="h-full inline fill-red-500" />,
  [AlertType.Info]: <span />,
  [AlertType.Success]: <SuccessIcon className="h-full inline fill-green-600" />,
};

export default function AlertManager() {
  const alerts = useAlertStore().alerts;
  const mutateAlertState = useAlertStore().mutateState;

  function handleClick(id: string) {
    mutateAlertState((state) => {
      removeAlert(state, id);
    });
  }

  return (
    <ul
      className={`absolute p-3 list-none flex flex-col-reverse`}
      style={{ zIndex: ZIndexLayers.Alerts }}
    >
      {alerts
        .map((alert) => {
          return (
            <li key={`alert-${alert.id}`}>
              <button
                id={`alert-${alert.id}`}
                className="animate-slide-appear-from-left min-h-10 mb-2 pl-2 pr-2
                border border-slate-400 bg-slate-950 text-zinc-300 pointer-events-auto flex items-center"
                onClick={() => handleClick(alert.id)}
              >
                <span className="max-h-10 h-10 pt-3 pb-3 mr-2 flex items-center">
                  {ALERT_ICONS_BY_TYPE[alert.alertType]}
                </span>
                {alert.message}
              </button>
            </li>
          );
        })
        .reverse()}
    </ul>
  );
}
