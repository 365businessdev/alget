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
import { addDependencyToManifest, getPackageCacheFromManifest } from "../Common/manifest";
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

  private async findPackage(packageId: string): Promise<Package | undefined> {
    let pkg: Package | undefined = undefined;

    if ((packageId.toLowerCase().startsWith("microsoft.")) && (packageId.toLowerCase().indexOf(".symbols") > -1)) {
      let nonSymbolPackageId = packageId.replace(".symbols", "");

      // TODO: Find a better way to handle this
      pkg = this.packages.find((p) => p.PackageID === nonSymbolPackageId);
      if (!pkg) {
        this.packages = await this.loadPackages(nonSymbolPackageId);
        pkg = this.packages.find((p) => p.PackageID === nonSymbolPackageId);
        if (!pkg) {
          pkg = this.packages.find((p) => p.PackageID === packageId);
          if (!pkg) {
            this.packages = await this.loadPackages(packageId);
            pkg = this.packages.find((p) => p.PackageID === packageId);
            if (!pkg) {
              output.logError(`Package ${packageId} not found`);
      
              return undefined;
            }
          }
        }
      }
    } else {
      pkg = this.packages.find((p) => p.PackageID === packageId);
      if (!pkg) {
        this.packages = await this.loadPackages(packageId);
        pkg = this.packages.find((p) => p.PackageID === packageId);
        if (!pkg) {
          output.logError(`Package ${packageId} not found`);
  
          return undefined;
        }
      }
    }

    if ((pkg.PackageID !== null) && (pkg.Source.name === settings.MSAppsFeedName)) {
      pkg.PackageID = pkg.PackageID.replace(".symbols", "");
    }

    return pkg;
  }

  /// <summary>
  /// Loads the packages from the configured feeds
  /// </summary>
  public async loadPackages(filterString: string | undefined = undefined, resetList: boolean = false): Promise<Package[]> {
    if (resetList) {
      this.packages = [];
    }

    output.log("Loading packages from feeds");

    let pkgs: Package[] = [];

    if (settings.isMicrosoftFeedsEnabled()) {
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
    let pkg = await this.findPackage(packageId);
    if (pkg === undefined) {
      return;
    }

    if (packageVersion !== undefined) {
      if ((pkg.IsInstalled) && (pkg.Version >= packageVersion)) {
        output.log(`Package ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion} or newer already installed`);

        return;
      }

      output.log(`Searching matching version for package ${pkg.Name} (ID: ${pkg.PackageID}) in version range ${packageVersion}`);
      if (pkg.PackageMetadata === null) {
        output.log(`Fetching package metadata for ${pkg.Name} (ID: ${pkg.PackageID}) from package feeds`);
        pkg = await this.getPackageMetadataFromFeed(pkg);
        if (pkg.PackageMetadata === null) {
          output.logError(`Failed to fetch package metadata for ${pkg.Name} (ID: ${pkg.PackageID}) from package feeds`);

          return;
        }
      }
      const packageMetadataVersions = pkg.PackageMetadata.versions!;
      const versionRange = this.parseVersionRange(packageVersion);
      if (versionRange === null) {
        packageVersion = pkg.Version;
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
          case ((versionRange.minVersion !== versionRange.maxVersion) && (versionRange.maxVersion !== "") && (versionRange.isMinInclusive) && (versionRange.isMaxInclusive)):
            validVersions = packageMetadataVersions.filter((version: Versions) => version.version >= versionRange.minVersion && version.version <= versionRange.maxVersion);
            break;
          case ((versionRange.minVersion !== versionRange.maxVersion) && (versionRange.maxVersion !== "") && (versionRange.isMinInclusive) && (!versionRange.isMaxInclusive)):
            validVersions = packageMetadataVersions.filter((version: Versions) => version.version >= versionRange.minVersion && version.version < versionRange.maxVersion);
            break;
          case ((versionRange.minVersion !== versionRange.maxVersion) && (versionRange.maxVersion !== "") && (!versionRange.isMinInclusive) && (versionRange.isMaxInclusive)):
            validVersions = packageMetadataVersions.filter((version: Versions) => version.version > versionRange.minVersion && version.version <= versionRange.maxVersion);
            break;
          case ((versionRange.minVersion !== versionRange.maxVersion) && (versionRange.maxVersion !== "") && (!versionRange.isMinInclusive) && (!versionRange.isMaxInclusive)):
            validVersions = packageMetadataVersions.filter((version: Versions) => version.version > versionRange.minVersion && version.version < versionRange.maxVersion);
            break;
          case ((versionRange.maxVersion === "") && (!versionRange.isMinInclusive)):
            validVersions = packageMetadataVersions.filter((version: Versions) => version.version > versionRange.minVersion);
            break;
          case ((versionRange.maxVersion === "") && (versionRange.isMinInclusive)):
            validVersions = packageMetadataVersions.filter((version: Versions) => version.version >= versionRange.minVersion);
            break;
          case ((versionRange.minVersion === "") && (!versionRange.isMaxInclusive)):
            validVersions = packageMetadataVersions.filter((version: Versions) => version.version < versionRange.minVersion);
            break;
          case ((versionRange.minVersion === "") && (versionRange.isMaxInclusive)):
            validVersions = packageMetadataVersions.filter((version: Versions) => version.version <= versionRange.minVersion);
            break;
        }            
        if (validVersions.length === 0) {
          packageVersion = pkg.Version;
        } else {
          const sortedVersions: Versions[] = validVersions.sort((a: Versions, b: Versions) => a.version.localeCompare(b.version));
          packageVersion = sortedVersions[sortedVersions.length - 1].version;
        }
      }
    } else {
      packageVersion = pkg.UpdateVersion;

      if ((packageVersion === undefined) && (pkg.Source.name !== "Local")) {
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
      // const manifestPath = path.join(
      //   this.projectWorkspaceFolder.uri.fsPath,
      //   "app.json"
      // );
      //const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      //this.packages.push(... await getPackageCacheFromManifest(manifestPath, manifest));
      output.log(`Fetching dependencies for package ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion}`);
      for (const dependency of packageDependencies) {
        if (!(this.packages.find((p) => p.PackageID === dependency.ID && p.IsInstalled))) {
          output.log(`Downloading dependency ${dependency.ID} version ${dependency.Version}`);
          await this.install(dependency.ID, dependency.Version);
        }
      }
    }

    if ((packageVersion === pkg.Version) && (pkg.IsInstalled)) {
      return; // already installed
    }

    output.log(`Downloading package ${pkg.Name} (ID: ${pkg.PackageID}) version ${packageVersion} from ${pkg.Source.name} feed`);
    const downloadData = await downloadPackage(pkg.PackageID!, packageVersion, pkg.Source.url!);
    if (downloadData === "") {
      output.logError(
        `Failed to download package ${pkg.Name} (ID: ${pkg.PackageID}) from ${pkg.Source.name} feed`
      );

      return;
    }
    output.log(`Downloaded package ${pkg.Name} (ID: ${pkg.PackageID}) from ${pkg.Source.name} feed`);

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
      const zipData: any = await zip.loadAsync(downloadData, { base64: true });

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
      appFileName = this.RemoveInvalidChars(appFileName);
      const appFilePath = path.join(alPackagesFolder, appFileName);

      // Write the .app file to the .alpackages folder
      const content: Buffer = await appFileData.async("nodebuffer");
      try {
        fs.writeFileSync(
          appFilePath,
          content
        );
        
        output.log(`${pkg.Name} downloaded to '${appFilePath}'`);

        switch (true) {
          case ((pkg.ID === undefined) && (pkg.Publisher.toLowerCase() !== "microsoft")):
            output.logError(`Unable to add package ${pkg.Name} to AL project dependencies. App ID is missing in package metadata. Please report this to the package publisher.`);
            break;
          case ((pkg.ID !== undefined) && (!this.isMicrosoftSystemOrBaseApp(pkg))):
            // Update manifest file
            const manifestPath = path.join(
              this.projectWorkspaceFolder.uri.fsPath,
              "app.json"
            );
            addDependencyToManifest(manifestPath, pkg.ID, pkg.Name, pkg.Publisher, packageVersion);
            break;
        }

        pkg.IsInstalled = true;
        pkg.Version = packageVersion;
        const packageIndex = this.packages.findIndex((p) => p.PackageID === pkg.PackageID);
        if (packageIndex !== -1) {
            this.packages[packageIndex] = pkg;
        }
      } catch (error) {
        output.logError(`Failed to write ${appFileName}: ${error}`);

        return;
      }
    } catch (error) {
      output.logError(`Error extracting .app file from NuGet package ${pkg.Name}: ${error}`);
    }
  }

  /// <summary>
  /// Gets the dependencies of a package
  /// </summary>
  async getPackageDependencies(packageId: string, packageVersion: string): Promise<PackageDependency[]> {
    let pkg = await this.findPackage(packageId);
    if (pkg === undefined) {
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
    if (!packageManifest.metadata[0].dependencies) {
      return [];
    }
    if (!packageManifest.metadata[0].dependencies[0].dependency) {
      return [];
    }
    packageManifest.metadata[0].dependencies[0].dependency.forEach((dependency: any) => {
      if (dependency.$.id === "Microsoft.Application.symbols") {
        let countryCode = "";
        if (pkg.CountryCode !== "") {
          countryCode = pkg.CountryCode;
        } else {
          countryCode = settings.getCountryCode();
        }
        dependency.$.id = `Microsoft.Application.${countryCode.toUpperCase()}.symbols`;
      }
      packageDependencies.push({
          ID: dependency.$.id,
          Version: dependency.$.version
        }
      );
    });

    return packageDependencies;
  }

  private updatePackageMetadata(pkg: Package, feedPackageData: Package): Package {
    // update the package with the metadata from the feed
    if (pkg.Description === "") {
      pkg.Description = feedPackageData.Description;
    }
    pkg.PackageMetadata = feedPackageData.PackageMetadata;
    pkg.Source = feedPackageData.Source;

    if (feedPackageData.Version === pkg.Version) {
      return pkg;
    }

    pkg.UpdateVersion = feedPackageData.Version;

    if (pkg.Version !== pkg.MinimumVersion) {
      output.log(`Update for package '${pkg.PackageID}' (Version ${feedPackageData.Version}) is available.`);
    }
    return pkg;
  }

  async getPackageMetadataFromFeed(pkg: Package): Promise<Package> {
    if (pkg.PackageID === null) {
      return pkg;
    }

    if (pkg.Source.url !== undefined) {
      const packages = await fetchPackagesFromFeed(
        new PackageSource(
          pkg.Source.name,
          pkg.Source.url,
          pkg.Source.packageIDSchema,
          pkg.Source.authorizationHeader
        ),
        pkg.PackageID,
        false
      );
      if (packages.length !== 0) {
        return this.updatePackageMetadata(pkg, packages[0]);
      }
    } else {
      let packages: Package[];

      if (pkg.Publisher.toLowerCase() === "microsoft") {
        packages = await fetchPackagesFromFeed(
          new PackageSource(
            settings.MSSymbolsFeedName,
            settings.MSSymbolsFeedUrl
          ),
          pkg.PackageID,
          false
        );
        if (packages.length !== 0) {
          return this.updatePackageMetadata(pkg, packages[0]);
        }
      }

      packages = await fetchPackagesFromFeed(
        new PackageSource(
          settings.AppSourceSymbolsFeedName,
          settings.AppSourceSymbolsFeedUrl
        ),
        pkg.PackageID,
        false
      );
      if (packages.length !== 0) {
        return this.updatePackageMetadata(pkg, packages[0]);
      }

      for (const feed of (settings.getCustomFeeds() as PackageSource[])) {
        // transform package ID based on the package source schema
        const packageId = feed.packageIDSchema !== "" ? 
          feed.packageIDSchema.toLowerCase()
            .replace("{publisher}", pkg.Publisher)
            .replace("{name}", pkg.Name)
            .replace("{version}", pkg.Version)
            .replace("{appid}", pkg.ID ? pkg.ID : "")
          : pkg.PackageID;

        packages = await fetchPackagesFromFeed(
          new PackageSource(
            feed.name,
            feed.url,
            feed.packageIDSchema,
            feed.authorizationHeader
          ),
          packageId,
          false
        );
        if (packages.length !== 0) {
          return this.updatePackageMetadata(pkg, packages[0]);
        }
      }
    }

    return pkg;
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

  /// <summary>
  /// Parses a version range string into a VersionRange object
  /// </summary>
  parseVersionRange(range: string): VersionRange | null {
    // Handle exact version
    if ((range.split('.').length === 4) && (!range.startsWith('[')) && (!range.endsWith(']')) && (!range.startsWith('(')) && (!range.endsWith(')')) && (range.indexOf(',') === -1)) {
      return {
        minVersion: range,
        maxVersion: range,
        isMinInclusive: true,
        isMaxInclusive: true
      };
    }
    // Handle simple min. version
    if ((/^\d+\.\d+(\.\d+)?(\.\d+)?$/.test(range))) {
      const version = range;
      const parts = version.split('.');
      while (parts.length < 4) {
        parts.push('0');
      }
      const fullVersion = parts.join('.');
      return {
        minVersion: fullVersion,
        maxVersion: '',
        isMinInclusive: true,
        isMaxInclusive: false
      };

    }
    // Handle exact version
    if (/^\[\d+\.\d+(\.\d+)?(\.\d+)?\]$/.test(range))  {
      const version = range.replace(/[\[\]]/g, ''); // Remove brackets if present
      const parts = version.split('.');
      while (parts.length < 4) {
        parts.push('0');
      }
      const fullVersion = parts.join('.');
      return {
        minVersion: fullVersion,
        maxVersion: fullVersion,
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

  private isMicrosoftSystemOrBaseApp(pkg: Package): boolean {
    if (pkg.Publisher.toLowerCase() !== "microsoft") {
      return false;
    }

    if (
      (pkg.ID === "437dbf0e-84ff-417a-965d-ed2bb9650972") || // Base Application
      (pkg.ID === "f3552374-a1f2-4356-848e-196002525837") || // Business Foundation
      (pkg.ID === "63ca2fa4-4f03-4f2b-a480-172fef340d3f") // System Application
    ) {
      return true;
    }

    return false;
  }

  /// <summary>
  /// Removes invalid characters from a file name
  /// </summary>
  RemoveInvalidChars(fileName: string): string {
    return fileName.replace(/[/\\?%*:|"<>]/g, '-');
  }
}

export default PackageManager;

export interface VersionRange {
  minVersion: string;
  maxVersion: string;
  isMinInclusive: boolean;
  isMaxInclusive: boolean;
}