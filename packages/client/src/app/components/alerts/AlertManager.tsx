import { useAlertStore } from "@/stores/alert-store";
import React from "react";
import { removeAlert } from ".";
import { ZIndexLayers } from "@/app/z-index-layers";

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
        .map((alert) => (
          <li key={`alert-${alert.id}`}>
            <button
              id={`alert-${alert.id}`}
              className="animate-slide-appear-from-left min-h-10 mb-2 pl-2 pr-2
                         border border-slate-400 bg-slate-950 text-zinc-300 pointer-events-auto"
              onClick={() => handleClick(alert.id)}
            >
              {alert.message}
            </button>
          </li>
        ))
        .reverse()}
    </ul>
  );
}
