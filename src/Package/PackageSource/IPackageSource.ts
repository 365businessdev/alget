/**
 * @license
 * 365 business development GmbH
 * 
 * This source code is licensed under the 365 business development license terms.
 */

import { Package } from "../Package";
import { PackageSourceType } from "./PackageSourceType";

export interface IPackageSource {
    /// <summary>
    /// Specifies the type of the package source.
    /// </summary>
    Type: PackageSourceType;

    /// <summary>
    /// Specifies the name of the package source.
    /// </summary>
    Name: string;

    /// <summary>
    /// Specifies the description of the package source.
    /// </summary>
    Description: string;

    /// <summary>
    /// Specifies the publisher of the package source (if applicable).
    /// </summary>
    Publisher: string | undefined;

    /// <summary>
    /// Specifies the URL of the package source.
    /// </summary>
    Url: string | undefined;

    /// <summary>
    /// Specifies the URL of the package source website.
    /// </summary>
    WebsiteUrl: string | undefined;

    /// <summary>
    /// Specifies the schema package Ids are expected to follow.
    /// </summary>
    PackageIdSchema: string;

    /// <summary>
    /// Specifies the authentication header, if required.
    /// </summary>
    AuthenticationHeader: string | undefined;

    /// <summary>
    /// Converts the package source response to Package.
    /// </summary>
    toPackage(data: any): Package;

    isPublisherFeed(publisher: string | undefined): boolean;
    getPackageId(publisher: string, name: string, id: string, countryCode: string): string;
    getPackageIdFromPackage(pkg: Package, countryCode: string): string;
    getPackageByName(packageName: string, prerelease: boolean): Promise<any>;
    getPackageById(packageId: string, prerelease: boolean): Promise<any>;
    getPackageManifestById(packageId: string, packageVersion: string): Promise<any>;
    downloadPackageById(packageId: string, packageVersion: string): Promise<string>;
}