import { Package } from "./package";
import { PackageSource } from "./package-source";
import { Project } from "./project";

/// <summary>
/// Represents a message sent between the extension and the webview
/// </summary>
export interface ExtensionMessage {
  command: string;
  data: Project | Package[] | PackageSource[] | string;
}
