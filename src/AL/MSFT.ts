import { Package } from "../Package/Package";
import { PackageVersion } from "../Package/PackageVersion";

/// <summary>
/// Provides Microsoft dependencies.
/// </summary>
export class MSFT {

    /// <summary>
    /// Get dependencies for Microsoft applications.
    /// </summary>
    /// <param name="platform">The platform version.</param>
    /// <param name="application">The application version.</param>
    /// <returns>The list of dependencies.</returns>
    public static getDependencies(platform: PackageVersion, application: PackageVersion): Package[] {
        let dependencies: Package[] = [];

        dependencies.push(this.GetPlatformPackage(platform));
        dependencies.push(this.GetApplicationPackage(application));
        dependencies.push(this.GetBaseApplicationPackage(application));
        // Microsofts Business Foundation app has been introduced in version 24.
        if (application.Major >= 24) {
            dependencies.push(this.GetBusinessFoundationPackage(application));
        }
        dependencies.push(this.GetSystemApplicationPackage(application));

        return dependencies;
    }

    /// <summary>
    /// Get Microsoft Platform package.
    /// </summary>
    /// <param name="version">The package version.</param>
    /// <returns>The platform package.</returns>
    private static GetPlatformPackage(version: PackageVersion): Package {
        let pkg: Package = new Package(
            '00000000-0000-0000-0000-00000000000',
            'Platform',
            'Microsoft',
            version
        );
        pkg.BriefDescription = 'Platform';
        
        return pkg;
    }

    /// <summary>
    /// Get Microsoft Application package.
    /// </summary>
    /// <param name="version">The package version.</param>
    /// <returns>The platform package.</returns>
    private static GetApplicationPackage(version: PackageVersion): Package {
        let pkg: Package = new Package(
            '00000000-0000-0000-0000-00000000000',
            'Application',
            'Microsoft',
            version
        );
        pkg.BriefDescription = 'Application';
        pkg.Description = 'Provides business processes that are typical for small and mid-sized companies, such as sales and purchasing, and customer and vendor management, plus complex processes, such as assembly, manufacturing, service, and directed warehouse management.';
        
        return pkg;
    }

    /// <summary>
    /// Get Microsoft Base Application package.
    /// </summary>
    /// <param name="version">The package version.</param>
    /// <returns>The platform package.</returns>
    private static GetBaseApplicationPackage(version: PackageVersion): Package {
        let pkg: Package = new Package(
            '437dbf0e-84ff-417a-965d-ed2bb9650972',
            'Base Application',
            'Microsoft',
            version
        );
        pkg.BriefDescription = 'Base Application';
        pkg.Description = 'Provides business processes that are typical for small and mid-sized companies, such as sales and purchasing, and customer and vendor management, plus complex processes, such as assembly, manufacturing, service, and directed warehouse management.';
        
        return pkg;
    }

    /// <summary>
    /// Get Microsoft Business Foundation package.
    /// </summary>
    /// <param name="version">The package version.</param>
    /// <returns>The platform package.</returns>
    private static GetBusinessFoundationPackage(version: PackageVersion): Package {
        let pkg: Package = new Package(
            'f3552374-a1f2-4356-848e-196002525837',
            'Business Foundation',
            'Microsoft',
            version
        );
        pkg.BriefDescription = 'Business Foundation';
        pkg.Description = 'Contains an expansive set of open source modules that make it easier to build, maintain, and easily upgrade on-premises and online apps. These modules let you focus on the business logic, and the needs of your users or customers.';

        return pkg;
    }

    /// <summary>
    /// Get Microsoft System Application package.
    /// </summary>
    /// <param name="version">The package version.</param>
    /// <returns>The platform package.</returns>
    private static GetSystemApplicationPackage(version: PackageVersion): Package {
        let pkg: Package = new Package(
            '63ca2fa4-4f03-4f2b-a480-172fef340d3f',
            'System Application',
            'Microsoft',
            version
        );
        pkg.BriefDescription = 'System Application';
        pkg.Description = 'Contains an expansive set of open source modules that make it easier to build, maintain, and easily upgrade on-premises and online apps. These modules let you focus on the business logic, and the needs of your users or customers.';

        return pkg;
    }
}