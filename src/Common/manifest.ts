import fs = require("fs");
import path = require("path");
import * as settings from "../Common/settings";
import { Package } from "../Models/package";
import * as output from "../output";
import { fetchPackagesFromFeed } from "../NuGet/fetchPackages";

export async function getPackageCacheFromManifestFile(
  manifestPath: string
): Promise<Package[]> {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest could not be found at '${manifestPath}'`);
  }
  let manifest = fs.readFileSync(manifestPath, "utf8");

  return getPackageCacheFromManifest(manifestPath, JSON.parse(manifest));
}

export async function getPackageCacheFromManifest(
  manifestPath: string,
  manifest: any
): Promise<Package[]> {
  let packages: Package[] = [];

  if (!manifest.application) {
    throw new Error("Application not found in the manifest");
  }

  let countryCode = settings.getCountryCode();
  let projectPath = path.dirname(manifestPath);
  let alPackagesPath = path.join(projectPath, ".alpackages");

  // Add the application package
  let pkg: Package = new Package(
    `Microsoft.Application.${countryCode}.symbols`,
    null,
    manifest.application,
    getVersionFromALPackagesCache(
      "Microsoft",
      "Application",
      manifest.application,
      alPackagesPath
    ),
    "Application",
    "Provides business processes that are typical for small and mid-sized companies, such as sales and purchasing, and customer and vendor management, plus complex processes, such as assembly, manufacturing, service, and directed warehouse management.",
    "Microsoft",
    countryCode,
    {
      name: "Local",
    }
  );
  pkg = await checkUpdateVersionAvailable(pkg);
  packages.push(pkg);

  // Add the base application package
  pkg = new Package(
    `Microsoft.BaseApplication.${countryCode}.symbols.437dbf0e-84ff-417a-965d-ed2bb9650972`,
    "437dbf0e-84ff-417a-965d-ed2bb9650972",
    manifest.application,
    getVersionFromALPackagesCache(
      "Microsoft",
      "Base Application",
      manifest.application,
      alPackagesPath
    ),
    "Base Application",
    "Provides business processes that are typical for small and mid-sized companies, such as sales and purchasing, and customer and vendor management, plus complex processes, such as assembly, manufacturing, service, and directed warehouse management.",
    "Microsoft",
    countryCode,
    {
      name: "Local",
    }
  );
  pkg = await checkUpdateVersionAvailable(pkg);
  packages.push(pkg);

  // Check if the major version in manifest.application is equal or larger than 24 and add the Business Foundation package
  const majorVersion = parseInt(manifest.application.split(".")[0], 10);
  if (majorVersion >= 24) {
    pkg = new Package(
      `Microsoft.BusinessFoundation.${countryCode}.symbols.f3552374-a1f2-4356-848e-196002525837`,
      "f3552374-a1f2-4356-848e-196002525837",
      manifest.application,
      getVersionFromALPackagesCache(
        "Microsoft",
        "Business Foundation",
        manifest.application,
        alPackagesPath
      ),
      "Business Foundation",
      "Contains an expansive set of open source modules that make it easier to build, maintain, and easily upgrade on-premises and online apps. These modules let you focus on the business logic, and the needs of your users or customers.",
      "Microsoft",
      countryCode,
      {
        name: "Local",
      }
    );
    pkg = await checkUpdateVersionAvailable(pkg);
    packages.push(pkg);
  }

  // Add the platform package
  pkg = new Package(
    `Microsoft.Platform.symbols`,
    null,
    manifest.platform,
    getVersionFromALPackagesCache(
      "Microsoft",
      "System",
      manifest.platform,
      alPackagesPath
    ),
    "Platform",
    "",
    "Microsoft",
    "",
    {
      name: "Local",
    }
  );
  pkg = await checkUpdateVersionAvailable(pkg);
  packages.push(pkg);

  // Add the system application package
  pkg = new Package(
    `Microsoft.SystemApplication.${countryCode}.symbols.63ca2fa4-4f03-4f2b-a480-172fef340d3f`,
    "63ca2fa4-4f03-4f2b-a480-172fef340d3f",
    manifest.platform,
    getVersionFromALPackagesCache(
      "Microsoft",
      "System Application",
      manifest.platform,
      alPackagesPath
    ),
    "System Application",
    "Contains an expansive set of open source modules that make it easier to build, maintain, and easily upgrade on-premises and online apps. These modules let you focus on the business logic, and the needs of your users or customers.",
    "Microsoft",
    countryCode,
    {
      name: "Local",
    }
  );
  pkg = await checkUpdateVersionAvailable(pkg);
  packages.push(pkg);

  if (manifest.dependencies.length > 0) {
    for (const dependency of manifest.dependencies) {
      let pkg = new Package(
        null,
        dependency.id,
        dependency.version,
        getVersionFromALPackagesCache(
          dependency.publisher,
          dependency.name,
          dependency.version,
          alPackagesPath
        ),
        dependency.name,
        "",
        dependency.publisher,
        countryCode,
        {
          name: "Local",
        }
      );
      pkg = await checkUpdateVersionAvailable(pkg);
      packages.push(pkg);
    }
  }

  return packages;
}

function getVersionFromALPackagesCache(
  publisher: string,
  name: string,
  minVersion: string,
  alPackagesPath: string
): string {
  let version = minVersion;
  try {
    fs.readdirSync(alPackagesPath).forEach((file) => {
      if (
        file
          .toLowerCase()
          .startsWith(`${publisher.toLowerCase()}_${name.toLowerCase()}`)
      ) {
        version = file.split("_")[2].replaceAll(".app", "");
      }
    });
  } catch (error) {
    console.log(error);
  }
  return version;
}

async function checkUpdateVersionAvailable(
  pkg: Package
): Promise<Package> {
  if (pkg.PackageID === null) {
    return pkg;
  }

  let packages;
  if (pkg.Publisher.toLowerCase() === "microsoft") {
    packages = await fetchPackagesFromFeed(
      settings.MSSymbolsFeedUrl,
      pkg.PackageID,
      false
    );
    if (packages.length === 0) {
      packages = await fetchPackagesFromFeed(
        settings.AppSourceSymbolsFeedUrl,
        pkg.PackageID,
        false
      );
      if (packages.length === 0) {
        return pkg;
      }

      // update the package with the metadata from the feed
      pkg.PackageMetadata = packages[0].PackageMetadata;
      pkg.Source = packages[0].Source;

      if (packages[0].Version === pkg.Version) {
        return pkg;
      }

      pkg.UpdateVersion = packages[0].Version;

      output.log(`Update for package '${pkg.PackageID}' (Version ${packages[0].Version}) is available.`);
      return pkg;
    }

    // update the package with the metadata from the feed
    pkg.PackageMetadata = packages[0].PackageMetadata;
    pkg.Source = packages[0].Source;

    if (packages[0].Version === pkg.Version) {
      return pkg;
    }

    pkg.UpdateVersion = packages[0].Version;

    output.log(`Update for package '${pkg.PackageID}' (Version ${packages[0].Version}) is available.`);
    return pkg;
  } else {
    packages = await fetchPackagesFromFeed(
      settings.AppSourceSymbolsFeedUrl,
      pkg.PackageID,
      false
    );
    if (packages.length === 0) {
      return pkg;
    }

    // update the package with the metadata from the feed
    pkg.PackageMetadata = packages[0].PackageMetadata;
    pkg.Source = packages[0].Source;

    if (packages[0].Version === pkg.Version) {
      return pkg;
    }

    pkg.UpdateVersion = packages[0].Version;

    output.log(`Update for package '${pkg.PackageID}' (Version ${packages[0].Version}) is available.`);
    return pkg;
  }
}
