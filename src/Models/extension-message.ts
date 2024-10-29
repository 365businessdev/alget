import { Package } from "./package";
import { PackageSource } from "./package-source";
import { Project } from "./project";

export interface ExtensionMessage {
  command: string;
  data: Project | Package[] | PackageSource[] | string;
}
