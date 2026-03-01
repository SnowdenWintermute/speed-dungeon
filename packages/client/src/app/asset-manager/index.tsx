"use client";
import { getClientAppAssetService } from "@/singletons";
import React, { useEffect } from "react";

export default function AssetManager() {
  useEffect(() => {
    const initAssetService = async () => {
      await getClientAppAssetService().initialize();
      try {
        getClientAppAssetService().scheduleAssetUpdates();
      } catch (err) {
        console.error(err);
      }
    };
    initAssetService();
  }, []);
  return <div id="asset-manager"></div>;
}
