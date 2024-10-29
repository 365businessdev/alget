import { Package } from "../Models/package";
import * as output from "../output";
import { downloadPackage } from "../NuGet/downloadPackage";
import { downloadPackageManifest } from "../NuGet/downloadPackageManifest";
import * as vscode from "vscode";
import { PackageDependency } from '../Models/package-dependency';
const fs = require("fs");
const path = require("path");

class PackageManager {
  private static packages: Package[] = [];
  private static projectWorkspaceFolder: vscode.WorkspaceFolder;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  /// <summary>
  /// Sets the project workspace folder
  /// </summary>
  static setProjectWorkspaceFolder(
    projectWorkspaceFolder: vscode.WorkspaceFolder
  ): void {
    this.projectWorkspaceFolder = projectWorkspaceFolder;
  }

  /// <summary>
  /// Sets the packages for the package manager instance
  /// </summary>
  static setPackageCache(packages: Package[]): void {
    this.packages = packages;
  }

  /// <summary>
  /// Installs a package
  /// </summary>
  static install(packageId: string, packageVersion: string): void {
    const pkg = this.packages.find((p) => p.PackageID === packageId);
    if (!pkg) {
      output.logError(`Package ${packageId} not found`);

      return;
    }
    output.log(
      `Downloading package ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion} from ${pkg.Source.name} feed`
    );
    if (pkg.PackageID === null) {
      output.logError(
        `Failed to download package ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion} from ${pkg.Source.name} feed`
      );

      return;
    }
    downloadPackage(pkg.PackageID, packageVersion, pkg.Source.url!).then(
      (downloadData) => {
        if (downloadData === "") {
          output.logError(
            `Failed to download package ${pkg.Name} (ID: ${pkg.PackageID}) from ${pkg.Source.name} feed`
          );

          return;
        }
        output.log(
          `Downloaded package ${pkg.Name} (ID: ${pkg.PackageID}) from ${pkg.Source.name} feed`
        );

        const alPackagesFolder = path.join(
          this.projectWorkspaceFolder.uri.fsPath,
          ".alpackages"
        );

        // Ensure the .alpackages folder exists
        if (!fs.existsSync(alPackagesFolder)) {
          fs.mkdirSync(alPackagesFolder);
        }

        try {
          const JSZip = require("jszip");
          const zip = new JSZip();
          zip.loadAsync(downloadData, { base64: true }).then((zipData: any) => {
            // Extract the .app file from the nupkg (zip file)
            const packageItem = Object.keys(zipData.files).find((fileName) =>
              fileName.endsWith(".app")
            );
            if (!packageItem) {
              output.logError(`No .app file found in package ${pkg.Name}`);
              return;
            }
            const appFileData = zipData.files[packageItem];
            const appFileName = `${pkg.Publisher}_${pkg.Name}_${packageVersion}.app`;
            const appFilePath = path.join(alPackagesFolder, appFileName);

            // Write the .app file to the .alpackages folder
            appFileData.async("nodebuffer").then((content: Buffer) => {
              fs.writeFile(
                appFilePath,
                content,
                (err: NodeJS.ErrnoException | null) => {
                  if (err) {
                    output.logError(
                      `Failed to write ${appFileName}: ${err.message}`
                    );
                    return;
                  }
                  output.log(`${pkg.Name} downloaded to '${appFilePath}'`);
                }
              );
            });
          });
        } catch (error) {
          output.logError(
            `Error extracting .app file from package ${pkg.Name}: ${error}`
          );
        }
      }
    );
  }

  static async getPackageDependencies(packageId: string, packageVersion: string): Promise<PackageDependency[]> {
    const pkg = this.packages.find((p) => p.PackageID === packageId);
    if (!pkg) {
      output.logError(`Package ${packageId} not found`);

      return [];
    }
    packageVersion = pkg.UpdateVersion ? pkg.UpdateVersion : packageVersion;
    output.log(`Downloading package manifest ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion} from ${pkg.Source.name} feed`);
    if (pkg.PackageID === null) {
      output.logError(`Failed to download package manifest ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion} from ${pkg.Source.name} feed`);

      return [];
    }

    const packageManifest = await downloadPackageManifest(
      pkg.PackageID,
      packageVersion,
      pkg.Source.url!
    );
    if (packageManifest === "") {
      output.logError(
        `Failed to download package manifest for ${pkg.Name} (ID: ${pkg.PackageID}) from ${pkg.Source.name} feed`
      );

      return [];
    }

    let packageDependencies: PackageDependency[] = [];
    if (!packageManifest.metadata[0].dependencies[0].dependency) {
      return [];
    }
    packageManifest.metadata[0].dependencies[0].dependency.forEach((dependency: any) => {
      packageDependencies.push({
          ID: dependency.$.id,
          Version: dependency.$.version
        }
      );
    });

    return packageDependencies;
  }

  static uninstall(packageName: string): void {
    console.log(`Uninstalling package: ${packageName}`);
    // Implementation for uninstalling a package
  }

  static update(packageName: string): void {
    console.log(`Updating package: ${packageName}`);
    // Implementation for updating a package
  }

  static list(): void {
    console.log("Listing all packages");
    // Implementation for listing all packages
  }
}

export default PackageManager;
