/// <summary>
/// Represents a package dependency
/// </summary>
export interface PackageDependency {
    /// <summary>
    /// The ID of the package.
    /// </summary>
    ID: string;

    /// <summary>
    /// NuGet version range.
    /// </summary>
    Version: string;
}