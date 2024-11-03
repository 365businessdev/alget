import { Package } from "../Models/package";
import * as settings from "../Common/settings";
import * as output from "../output";
import { fetchPackagesFromFeed } from "../NuGet/fetchPackages";
import { downloadPackage } from "../NuGet/downloadPackage";
import { downloadPackageManifest } from "../NuGet/downloadPackageManifest";
import * as vscode from "vscode";
import { PackageDependency } from '../Models/package-dependency';
import { Versions } from '../Models/nuspec';
import { PackageSource } from '../Models/package-source';
const fs = require("fs");
const path = require("path");

/// <summary>
/// Class for managing packages
/// </summary>
class PackageManager {
  private packages: Package[] = [];
  private projectWorkspaceFolder: vscode.WorkspaceFolder;

  /// <summary>
  /// Initializes a new instance of the PackageManager class
  /// </summary>
  constructor(projectWorkspaceFolder: vscode.WorkspaceFolder) {
    this.projectWorkspaceFolder = projectWorkspaceFolder;
  }

  /// <summary>
  /// Loads the packages from the configured feeds
  /// </summary>
  public async loadPackages(filterString: string | undefined = undefined): Promise<Package[]> {
    this.packages = [];

    output.log("Loading packages from feeds");

    let pkgs: Package[] = [];

    if (settings.isMSSymbolsFeedEnabled()) {
      output.log(
        `Fetching packages from '${settings.MSSymbolsFeedUrl}' feed url`
      );
      pkgs = await fetchPackagesFromFeed(
        new PackageSource(
          settings.MSSymbolsFeedName,
          settings.MSSymbolsFeedUrl
        ),
        filterString === undefined ? `.${settings.getCountryCode().toUpperCase() || ""}.` : filterString,
        false
      );
      output.log(`${pkgs.length} packages received from feed`);
      this.packages.push(...pkgs);
    }

    if (settings.isAppSourceSymbolsFeedEnabled()) {
      output.log(
        `Fetching packages from '${settings.AppSourceSymbolsFeedUrl}' feed url`
      );
      pkgs = await fetchPackagesFromFeed(
        new PackageSource(
          settings.AppSourceSymbolsFeedName,
          settings.AppSourceSymbolsFeedUrl
        ),
        filterString === undefined ? "" : filterString,
        false
      );
      output.log(`${pkgs.length} packages received from feed`);
      this.packages.push(...pkgs);
    }

    this.packages.push(...await this.loadPackagesFromCustomFeeds(filterString));

    return this.packages;
  }

  /// <summary>
  /// Loads the packages from the custom feeds
  /// </summary>
  private async loadPackagesFromCustomFeeds(filterString: string | undefined = undefined): Promise<Package[]> {
    let packages: Package[] = [];

    const customFeeds = settings.getCustomFeeds();
    for (const feed of customFeeds) {
      output.log(`Fetching packages from '${feed.url}' feed url`);
      const pkgs = await fetchPackagesFromFeed(
        new PackageSource(
          feed.name,
          feed.url,
          feed.packageIDSchema,
          feed.apiKey
        ),
        filterString === undefined ? "" : filterString,
        false
      );
      output.log(`${pkgs.length} packages received from feed`);
      packages.push(...pkgs);
    }

    return packages;
  }

  /// <summary>
  /// Sets the packages for the package manager instance
  /// </summary>
  setPackageCache(packages: Package[]): void {
    this.packages = packages;
  }

  /// <summary>
  /// Installs a package
  /// </summary>
  async install(packageId: string, packageVersion: string | undefined): Promise<void> {
    let pkg = this.packages.find((p) => p.PackageID === packageId);
    if (!pkg) {
      this.packages = await this.loadPackages(packageId);
      pkg = this.packages.find((p) => p.PackageID === packageId);
      if (!pkg) {
        output.logError(`Package ${packageId} not found`);

        return;
      }
    }

    if (packageVersion !== undefined) {
      const versionRegex = /^[0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?$/;
      if (!versionRegex.test(packageVersion)) {
        output.log(`Get actual version for package ${pkg.Name} (ID: ${pkg.PackageID}) in version range ${packageVersion}`);
        let pkgMetadata: Package[] = await fetchPackagesFromFeed(new PackageSource(pkg.Source.name, pkg.Source.url!, pkg.Source.packageIDSchema, pkg.Source.authorizationHeader), pkg.PackageID!, false);
        if (!pkgMetadata[0].PackageMetadata!.versions) {
          packageVersion = pkgMetadata[0].Version;
        } else {
          const packageMetadataVersions = pkgMetadata[0].PackageMetadata!.versions;
          const versionRange = this.parseVersionRange(packageVersion);
          if (versionRange === null) {
            packageVersion = pkgMetadata[0].Version;
          } else {
            let validVersions: Versions[] = [];

            switch (true) {
              case ((versionRange.minVersion === versionRange.maxVersion) && (versionRange.isMinInclusive) && (versionRange.isMaxInclusive)):
                validVersions = packageMetadataVersions.filter((version: Versions) => version.version === versionRange.minVersion);
                break;
              case ((versionRange.minVersion === versionRange.maxVersion) && (versionRange.isMinInclusive) && (!versionRange.isMaxInclusive)):
                validVersions = packageMetadataVersions.filter((version: Versions) => version.version > versionRange.minVersion);
                break;
              case ((versionRange.minVersion === versionRange.maxVersion) && (!versionRange.isMinInclusive) && (versionRange.isMaxInclusive)):
                validVersions = packageMetadataVersions.filter((version: Versions) => version.version < versionRange.minVersion);
                break;
              case ((versionRange.minVersion === versionRange.maxVersion) && (!versionRange.isMinInclusive) && (!versionRange.isMaxInclusive)):
                validVersions = packageMetadataVersions.filter((version: Versions) => version.version !== versionRange.minVersion);
                break;
              case ((versionRange.minVersion !== versionRange.maxVersion) && (versionRange.isMinInclusive) && (versionRange.isMaxInclusive)):
                validVersions = packageMetadataVersions.filter((version: Versions) => version.version >= versionRange.minVersion && version.version <= versionRange.maxVersion);
                break;
              case ((versionRange.minVersion !== versionRange.maxVersion) && (versionRange.isMinInclusive) && (!versionRange.isMaxInclusive)):
                validVersions = packageMetadataVersions.filter((version: Versions) => version.version >= versionRange.minVersion && version.version < versionRange.maxVersion);
                break;
              case ((versionRange.minVersion !== versionRange.maxVersion) && (!versionRange.isMinInclusive) && (versionRange.isMaxInclusive)):
                validVersions = packageMetadataVersions.filter((version: Versions) => version.version > versionRange.minVersion && version.version <= versionRange.maxVersion);
                break;
              case ((versionRange.minVersion !== versionRange.maxVersion) && (!versionRange.isMinInclusive) && (!versionRange.isMaxInclusive)):
                validVersions = packageMetadataVersions.filter((version: Versions) => version.version > versionRange.minVersion && version.version < versionRange.maxVersion);
                break;
            }            
            if (validVersions.length === 0) {
              packageVersion = pkgMetadata[0].Version;
            } else {
              packageVersion = validVersions.sort((a: Versions, b: Versions) => a.version.localeCompare(b.version))[0].version;
            }
          }
        }
      } else {
        if ((pkg.IsInstalled) && (pkg.Version === packageVersion)) {
          output.log(`Package ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion} already installed`);

          return;
        }
      }
    } else {
      packageVersion = pkg.UpdateVersion;

      if (pkg.Source.name !== "Local") {
        packageVersion = pkg.Version;
      }

      if (packageVersion === undefined) {
        output.logError(`Could not find package version for ${pkg.Name} in package feeds`);

        return;
      }
    }

    output.log(`Checking dependencies for package ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion}`);
    const packageDependencies = await this.getPackageDependencies(pkg.PackageID!, packageVersion);
    if (packageDependencies.length > 0) {
      output.log(`Fetching dependencies for package ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion}`);
      for (const dependency of packageDependencies) {
        output.log(`Downloading dependency ${dependency.ID} version ${dependency.Version}`);
        await this.install(dependency.ID, dependency.Version);
      }
    }

    output.log(
      `Downloading package ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion} from ${pkg.Source.name} feed`
    );
    await downloadPackage(pkg.PackageID!, packageVersion, pkg.Source.url!).then(
      async (downloadData) => {
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
          await zip.loadAsync(downloadData, { base64: true }).then(async (zipData: any) => {
            // Extract the .app file from the nupkg (zip file)
            const packageItem = Object.keys(zipData.files).find((fileName) =>
              fileName.endsWith(".app")
            );
            if (!packageItem) {
              output.logError(`No .app file found in package ${pkg.Name}`);
              return;
            }
            const appFileData = zipData.files[packageItem];
            let appFileName = `${pkg.Publisher}_${pkg.Name}_${packageVersion}.app`;          
            if ((pkg.Publisher === "Microsoft") && (pkg.Name === "Platform")) {
              appFileName = `${pkg.Publisher}_System_${packageVersion}.app`;
            }
            const appFilePath = path.join(alPackagesFolder, appFileName);

            // Write the .app file to the .alpackages folder
            await appFileData.async("nodebuffer").then((content: Buffer) => {
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

  /// <summary>
  /// Gets the dependencies of a package
  /// </summary>
  async getPackageDependencies(packageId: string, packageVersion: string): Promise<PackageDependency[]> {
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
      if ((pkg.CountryCode !== "") && (dependency.$.id === "Microsoft.Application.symbols")) {
        dependency.$.id = `Microsoft.Application.${pkg.CountryCode.toUpperCase()}.symbols`;
      }
      packageDependencies.push({
          ID: dependency.$.id,
          Version: dependency.$.version
        }
      );
    });

    return packageDependencies;
  }

  uninstall(packageName: string): void {
    console.log(`Uninstalling package: ${packageName}`);
    // Implementation for uninstalling a package
  }

  update(packageName: string): void {
    console.log(`Updating package: ${packageName}`);
    // Implementation for updating a package
  }

  list(): void {
    console.log("Listing all packages");
    // Implementation for listing all packages
  }

  parseVersionRange(range: string): VersionRange | null {
    // Handle exact version
    if (/^\[\d+\.\d+(\.\d+)?(\.\d+)?\]$/.test(range)) {
      return {
        minVersion: range,
        maxVersion: range,
        isMinInclusive: true,
        isMaxInclusive: true
      };
    }
  
    // Handle ranges with brackets and parentheses
    const rangeRegex = /^[\[\(](.*?),(.*?)[\]\)]$/;
    const match = range.match(rangeRegex);
  
    if (!match) {
      return null;
    }
  
    return {
      minVersion: match[1].trim(),
      maxVersion: match[2].trim(),
      isMinInclusive: range.startsWith('['),
      isMaxInclusive: range.endsWith(']')
    };
  }
}

export default PackageManager;

export interface VersionRange {
  minVersion: string;
  maxVersion: string;
  isMinInclusive: boolean;
  isMaxInclusive: boolean;
}