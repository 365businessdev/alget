import { Package } from "./package";

export interface Project {
  id: string;
  publisher: string;
  name: string;
  version: string;
  fsPath: string;
  packages: Package[];
}
