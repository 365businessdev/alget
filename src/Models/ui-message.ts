export interface UIMessage {
  command: string;
}

export interface UninstallMessage extends UIMessage {
  packageId: string;
}

export interface InstallMessage extends UninstallMessage {
  packageVersion: string;
  packageSourceUrl: string;
}

export interface DataMessage extends UIMessage {
  data: string;
}
