import { IpcChannels } from "@shared/constants/ipcChannels";
import { getNetworkAdapters } from "../network/adapters";
import { getDnsServers } from "../network/dns";
import { runNetworkTest } from "../network/networkTest";
import { secureHandle } from "./secureHandle";

export function registerNetworkHandlers(): void {
  secureHandle(IpcChannels.network.getAdapters, async () => {
    return getNetworkAdapters();
  });

  secureHandle(IpcChannels.network.getDnsServers, async () => {
    return getDnsServers();
  });

  secureHandle(IpcChannels.network.runNetworkTest, async () => {
    return runNetworkTest();
  });
}
