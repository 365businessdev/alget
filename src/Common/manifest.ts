import fs = require("fs");
import path = require("path");
import * as settings from "../Common/settings";
import { Package } from "../Models/package";
import * as output from "../output";
import { fetchPackagesFromFeed } from "../NuGet/fetchPackages";
import { PackageSource } from "../Models/package-source";

/// <summary>
/// Reads the manifest file and save the manifest file.
/// </summary>
export function touchManifestFile(manifestPath: string) {
  if (!fs.existsSync(manifestPath)) {
    return;
  }

  saveManifestFile(manifestPath, JSON.parse(fs.readFileSync(manifestPath, "utf8")));
}

/// <summary>
/// Saves the manifest file.
/// </summary>
export function saveManifestFile(manifestPath: string, data: any) {
  fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf8");
  output.log(`Manifest saved successfully at '${manifestPath}'`);
}

/// <summary>
/// Adds a dependency to the manifest file.
/// </summary>
export function addDependencyToManifest(
  manifestPath: string,
  id: string,
  name: string,
  publisher: string,
  version: string
) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest could not be found at '${manifestPath}'`);
  }

  let manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  if (!manifest.dependencies) {
    manifest.dependencies = [];
  }

  if (manifest.dependencies.find((dependency: any) => dependency.id === id)) {
    return;
  }
  manifest.dependencies.push({ id, name, publisher, version });

  saveManifestFile(manifestPath, manifest);
}

/// <summary>
/// Removes a dependency from the manifest file.
/// </summary>
export function removeDependencyFromManifest(manifestPath: string, id: string) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest could not be found at '${manifestPath}'`);
  }

  let manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  if (!manifest.dependencies) {
    return;
  }

  manifest.dependencies = manifest.dependencies.filter(
    (dependency: any) => dependency.id !== id
  );

  saveManifestFile(manifestPath, manifest);
}

/// <summary>
/// Reads the manifest file and returns the packages.
/// </summary>
export async function getPackageCacheFromManifestFile(
  manifestPath: string
): Promise<Package[]> {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest could not be found at '${manifestPath}'`);
  }
  let manifest = fs.readFileSync(manifestPath, "utf8");

  return getPackageCacheFromManifest(manifestPath, JSON.parse(manifest));
}

/// <summary>
/// Reads the manifest and returns the packages.
/// </summary>
export async function getPackageCacheFromManifest(
  manifestPath: string,
  manifest: any
): Promise<Package[]> {
  let packages: Package[] = [];

  if (!manifest.application) {
    throw new Error("Application not found in the manifest");
  }

  let countryCode = settings.getCountryCode().toUpperCase();
  let projectPath = path.dirname(manifestPath);
  let alPackagesPath = path.join(projectPath, ".alpackages");

  // Add the application package
  let pkg: Package = new Package(
    `Microsoft.Application.${countryCode}.symbols`,
    undefined,
    manifest.application,
    manifest.application,
    "Application",
    "Provides business processes that are typical for small and mid-sized companies, such as sales and purchasing, and customer and vendor management, plus complex processes, such as assembly, manufacturing, service, and directed warehouse management.",
    "Microsoft",
    countryCode,
    new PackageSource("Local"),
    null,
    alPackagesPath
  );
  pkg = await checkUpdateVersionAvailable(pkg);
  packages.push(pkg);

  // Add the base application package
  pkg = new Package(
    `Microsoft.BaseApplication.${countryCode}.symbols.437dbf0e-84ff-417a-965d-ed2bb9650972`,
    "437dbf0e-84ff-417a-965d-ed2bb9650972",
    manifest.application,
    manifest.application,
    "Base Application",
    "Provides business processes that are typical for small and mid-sized companies, such as sales and purchasing, and customer and vendor management, plus complex processes, such as assembly, manufacturing, service, and directed warehouse management.",
    "Microsoft",
    countryCode,
    new PackageSource("Local"),
    null,
    alPackagesPath
  );
  pkg = await checkUpdateVersionAvailable(pkg);
  packages.push(pkg);

  // Check if the major version in manifest.application is equal or larger than 24 and add the Business Foundation package
  const majorVersion = parseInt(manifest.application.split(".")[0], 10);
  if ((majorVersion >= 24) || (parseInt(pkg.Version.split(".")[0]) >= 24)) {
    pkg = new Package(
      `Microsoft.BusinessFoundation.${countryCode}.symbols.f3552374-a1f2-4356-848e-196002525837`,
      "f3552374-a1f2-4356-848e-196002525837",
      manifest.application,
      manifest.application,
      "Business Foundation",
      "Contains an expansive set of open source modules that make it easier to build, maintain, and easily upgrade on-premises and online apps. These modules let you focus on the business logic, and the needs of your users or customers.",
      "Microsoft",
      countryCode,
      new PackageSource("Local"),
      null,
      alPackagesPath
    );
    pkg = await checkUpdateVersionAvailable(pkg);
    packages.push(pkg);
  }

  // Add the platform package
  pkg = new Package(
    `Microsoft.Platform.symbols`,
    undefined,
    manifest.platform,
    manifest.platform,
    "Platform",
    "",
    "Microsoft",
    "",
    new PackageSource("Local"),
    null,
    alPackagesPath
  );
  pkg = await checkUpdateVersionAvailable(pkg);
  packages.push(pkg);

  // Add the system application package
  pkg = new Package(
    `Microsoft.SystemApplication.${countryCode}.symbols.63ca2fa4-4f03-4f2b-a480-172fef340d3f`,
    "63ca2fa4-4f03-4f2b-a480-172fef340d3f",
    manifest.platform,
    manifest.platform,
    "System Application",
    "Contains an expansive set of open source modules that make it easier to build, maintain, and easily upgrade on-premises and online apps. These modules let you focus on the business logic, and the needs of your users or customers.",
    "Microsoft",
    countryCode,
    new PackageSource("Local"),
    null,
    alPackagesPath
  );
  pkg = await checkUpdateVersionAvailable(pkg);
  packages.push(pkg);

  if (manifest.dependencies.length > 0) {
    for (const dependency of manifest.dependencies) {
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
      pkg = await checkUpdateVersionAvailable(pkg);
      packages.push(pkg);
    }
  }

  return packages;
}

// TODO: Move to package manager
async function checkUpdateVersionAvailable(
  pkg: Package
): Promise<Package> {
  if (pkg.PackageID === null) {
    return pkg;
  }

  let packages;
  if (pkg.Publisher.toLowerCase() === "microsoft") {
    packages = await fetchPackagesFromFeed(
      new PackageSource(
        settings.MSSymbolsFeedName,
        settings.MSSymbolsFeedUrl
      ),
      pkg.PackageID,
      false
    );
    if (packages.length === 0) {
      packages = await fetchPackagesFromFeed(
        new PackageSource(
          settings.AppSourceSymbolsFeedName,
          settings.AppSourceSymbolsFeedUrl
        ),
        pkg.PackageID,
        false
      );
      if (packages.length === 0) {
        return pkg;
      }

      // update the package with the metadata from the feed
      if (pkg.Description === "") {
        pkg.Description = packages[0].Description;
      }
      pkg.PackageMetadata = packages[0].PackageMetadata;
      pkg.Source = packages[0].Source;

      if (packages[0].Version === pkg.Version) {
        return pkg;
      }

      pkg.UpdateVersion = packages[0].Version;

      if (pkg.Version !== pkg.MinimumVersion) {
        output.log(`Update for package '${pkg.PackageID}' (Version ${packages[0].Version}) is available.`);
      }
      return pkg;
    }

    // update the package with the metadata from the feed
    if (pkg.Description === "") {
      pkg.Description = packages[0].Description;
    }
    pkg.PackageMetadata = packages[0].PackageMetadata;
    pkg.Source = packages[0].Source;

    if (packages[0].Version === pkg.Version) {
      return pkg;
    }

    pkg.UpdateVersion = packages[0].Version;

    if (pkg.Version !== pkg.MinimumVersion) {
      output.log(`Update for package '${pkg.PackageID}' (Version ${packages[0].Version}) is available.`);
    }
    return pkg;
  } else {
    packages = await fetchPackagesFromFeed(
      new PackageSource(
        settings.AppSourceSymbolsFeedName,
        settings.AppSourceSymbolsFeedUrl
      ),
      pkg.PackageID,
      false
    );
    if (packages.length === 0) {
      return pkg;
    }

    // update the package with the metadata from the feed
    if (pkg.Description === "") {
      pkg.Description = packages[0].Description;
    }
    pkg.PackageMetadata = packages[0].PackageMetadata;
    pkg.Source = packages[0].Source;

    if (packages[0].Version === pkg.Version) {
      return pkg;
    }

    pkg.UpdateVersion = packages[0].Version;

    if (pkg.Version !== pkg.MinimumVersion) {
      output.log(`Update for package '${pkg.PackageID}' (Version ${packages[0].Version}) is available.`);
    }
    return pkg;
  }
}
