/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */
export interface IPackageSpecification {
    /// <summary>
    /// Specifies the Package ID.
    /// </summary>
    PackageId: string;

    /// <summary>
    /// Specifies the package name.
    /// </summary>
    Name: string;

    /// <summary>
    /// Specifies the author of the package.
    /// </summary>
    Author: string;

    /// <summary>
    /// Specifies the owner of the package.
    /// </summary>
    Owner: string;

    /// <summary>
    /// Specifies the icon URL of the package.
    /// </summary>
    IconUrl: string;

    /// <summary>
    /// Specifies the license URL of the package.
    /// </summary>
    LicenseUrl: string;

    /// <summary>
    /// Specifies the project URL of the package.
    /// </summary>
    ProjectUrl: string;

    /// <summary>
    /// Specifies whether the package requires a license acceptance.
    /// </summary>
    RequireLicenseAcceptance: boolean;

    /// <summary>
    /// Specifies the release notes of the package.
    /// </summary>
    ReleaseNotes: string;
}