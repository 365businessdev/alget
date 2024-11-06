import fs = require("fs");
import path = require("path");
import * as settings from "./settings";
import { Package } from "../Models/package";
import { PackageSource } from "../Models/package-source";
import { ManifestModel } from "../Models/manifest";
import { ManifestDependencyModel } from "../Models/al-manifest-dependency";
import { PackageManager } from '../Package/packageManager';

/// <summary>
/// Represents the AL manifest.
/// </summary>
export class ALManifest {

  /// <summary>
  /// Instance of the internal AL manifest.
  /// </summary>
  private manifest : ManifestModel;

  public Content(): any {
    return this.manifest.content;
  }

  constructor(manifestPath: string) {
    // check if AL manifest is exist
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest could not be found at '${manifestPath}'`);
    }

    // read and parse JSON AL manifest
    this.manifest = {
      path: manifestPath,
      content: this.readSync(manifestPath)
    };
  }

  /// <summary>
  /// Read AL manifest from filesystem.
  /// </summary>
  /// <param name="manifestPath">Full qualified path to read the manifest from. Omit this parameter to use instance manifest.</param>
  /// <returns>JSON object with AL manifest.</returns>
  public readSync(manifestPath?: string): any {
    if (manifestPath === undefined) {
      manifestPath = this.manifest.path;
    }

    return JSON.parse(
      fs.readFileSync(manifestPath, "utf8")
    );
  }

  /// <summary>
  /// Write AL manifest to filesystem.
  /// </summary>
  public writeSync(data: any) {
    fs.writeFileSync(
      this.manifest.path,
      JSON.stringify(
        data, null, 2
      )
    );
  }

  /// <summary>
  /// Reads and save the AL manifest.
  /// </summary>
  /// <remarks>Just touching the current AL manifest, to invoke listeners in file change.</remarks>
  public touchSync() {
    this.writeSync(
      this.readSync()
    );
  }

  /// <summary>
  /// Add dependency to AL manifest.
  /// </summary>
  public addDependencySync(dependency: ManifestDependencyModel) {
    if (!this.manifest.content.dependencies) {
      // initialize dependency array in JSON if not exist
      this.manifest.content.dependencies = [];
    } else {
      // look up for existing dependency entry
      if (this.manifest.content.dependencies.find(
        (existingDependency: any) => existingDependency.id === dependency.id)
      ) {
        return;
      }
    }

    // Ensure dependency.version is a four-part version number
    while (dependency.version.split('.').length < 4) {
      dependency.version += ".0";
    }

    this.manifest.content.dependencies.push(dependency);
    this.writeSync(this.manifest.content);
  }

  /// <summary>
  /// Remove dependency from AL manifest.
  /// </summary>
  public removeDependencySync(dependencyId: string) {
    if (!this.manifest.content.dependencies) {
      return;
    }
  
    this.manifest.content.dependencies = this.manifest.content.dependencies.filter(
      (dependency: any) => dependency.id !== dependencyId
    );
  
    this.writeSync(this.manifest.content);
  }

  /// <summary>
  /// Get all packages from the AL manifest.
  /// </summary>
  public async getPackagesAsync(checkForUpdateAvailable: boolean = true): Promise<Package[]> {
    let packages: Package[] = [];
  
    if (!this.manifest.content.application) {
      throw new Error("Application not found in the manifest");
    }
  
    let countryCode = settings.getCountryCode().toUpperCase();
    if (countryCode === "W1") {
      countryCode = "";
    }
    let projectPath = path.dirname(this.manifest.path);
    let alPackagesPath = path.join(projectPath, ".alpackages");
  
  
    let pkg: Package = new Package(
      `Microsoft.Application${countryCode}.symbols`,
      undefined,
      this.manifest.content.application,
      this.manifest.content.application,
      "Application",
      "Provides business processes that are typical for small and mid-sized companies, such as sales and purchasing, and customer and vendor management, plus complex processes, such as assembly, manufacturing, service, and directed warehouse management.",
      "Microsoft",
      countryCode,
      new PackageSource("Local"),
      null,
      alPackagesPath
    );
    if (checkForUpdateAvailable) {
      pkg = await PackageManager.getPackageMetadataFromFeedAsync(pkg);
    }
    packages.push(pkg);
  
    // Add the base application package
    pkg = new Package(
      `Microsoft.BaseApplication${countryCode}.symbols.437dbf0e-84ff-417a-965d-ed2bb9650972`,
      "437dbf0e-84ff-417a-965d-ed2bb9650972",
      this.manifest.content.application,
      this.manifest.content.application,
      "Base Application",
      "Provides business processes that are typical for small and mid-sized companies, such as sales and purchasing, and customer and vendor management, plus complex processes, such as assembly, manufacturing, service, and directed warehouse management.",
      "Microsoft",
      countryCode,
      new PackageSource("Local"),
      null,
      alPackagesPath
    );
    if (checkForUpdateAvailable) {
      pkg = await PackageManager.getPackageMetadataFromFeedAsync(pkg);
    }
    packages.push(pkg);
  
    // Check if the major version in manifest.application is equal or larger than 24 and add the Business Foundation package
    const majorVersion = parseInt(this.manifest.content.application.split(".")[0], 10);
    if ((majorVersion >= 24) || (parseInt(pkg.Version.split(".")[0]) >= 24)) {
      pkg = new Package(
        `Microsoft.BusinessFoundation${countryCode}.symbols.f3552374-a1f2-4356-848e-196002525837`,
        "f3552374-a1f2-4356-848e-196002525837",
        this.manifest.content.application,
        this.manifest.content.application,
        "Business Foundation",
        "Contains an expansive set of open source modules that make it easier to build, maintain, and easily upgrade on-premises and online apps. These modules let you focus on the business logic, and the needs of your users or customers.",
        "Microsoft",
        countryCode,
        new PackageSource("Local"),
        null,
        alPackagesPath
      );
      if (checkForUpdateAvailable) {
        pkg = await PackageManager.getPackageMetadataFromFeedAsync(pkg);
      }
      packages.push(pkg);
    }
  
    // Add the platform package
    pkg = new Package(
      `Microsoft.Platform.symbols`,
      undefined,
      this.manifest.content.platform,
      this.manifest.content.platform,
      "Platform",
      "",
      "Microsoft",
      "",
      new PackageSource("Local"),
      null,
      alPackagesPath
    );
    if (checkForUpdateAvailable) {
      pkg = await PackageManager.getPackageMetadataFromFeedAsync(pkg);
    }
    packages.push(pkg);
  
    // Add the system application package
    pkg = new Package(
      `Microsoft.SystemApplication${countryCode}.symbols.63ca2fa4-4f03-4f2b-a480-172fef340d3f`,
      "63ca2fa4-4f03-4f2b-a480-172fef340d3f",
      this.manifest.content.platform,
      this.manifest.content.platform,
      "System Application",
      "Contains an expansive set of open source modules that make it easier to build, maintain, and easily upgrade on-premises and online apps. These modules let you focus on the business logic, and the needs of your users or customers.",
      "Microsoft",
      countryCode,
      new PackageSource("Local"),
      null,
      alPackagesPath
    );
    if (checkForUpdateAvailable) {
      pkg = await PackageManager.getPackageMetadataFromFeedAsync(pkg);
    }
    packages.push(pkg);
  
    if (this.manifest.content.dependencies.length > 0) {
      for (const dependency of this.manifest.content.dependencies) {
        let pkg = new Package(
          null,
          dependency.id,
          dependency.version,
          dependency.version,
          dependency.name,
          "",
          dependency.publisher,
          countryCode,
          new PackageSource("Local"),
          null,
          alPackagesPath
        );
        if (checkForUpdateAvailable) {
          pkg = await PackageManager.getPackageMetadataFromFeedAsync(pkg);
        }
        packages.push(pkg);
      }
    }
  
    return packages;
  }
}