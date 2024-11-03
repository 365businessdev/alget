import { Package } from "./package";

/// <summary>
/// Represents a project
/// </summary>
export interface Project {
  id: string;
  publisher: string;
  name: string;
  version: string;
  fsPath: string;
  packages: Package[];
}
