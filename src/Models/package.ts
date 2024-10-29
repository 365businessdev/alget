import { NuSpec } from "./nuspec";
import { PackageSource } from "./package-source";
import * as output from "../output";
import { fetchPackagesFromFeed } from "../NuGet/fetchPackages";
import * as settings from "../Common/settings"; // Add this line to import settings

/// <summary>
/// Represents a AL package.
/// </summary>
export class Package {
    /// <summary>
    /// The ID of the package.
    /// </summary>
    public PackageID: string | null;

    /// <summary>
    /// Application ID.
    /// </summary>
    public ID: string | null;

    /// <summary>
    /// Minimum required version of the package.
    /// </summary>
    public MinimumVersion: string | null;

    /// <summary>
    /// Version of the package.
    /// </summary>
    public Version: string;

    /// <summary>
    /// Newer version of the package available for update.
    /// </summary>
    public UpdateVersion: string | undefined;

    /// <summary>
    /// Name of the package.
    /// </summary>
    public Name: string;

    /// <summary>
    /// Description of the package.
    /// </summary>
    public Description: string;

    /// <summary>
    /// Publisher of the package.
    /// </summary>
    public Publisher: string;

    /// <summary>
    /// Country code of the package.
    /// </summary>
    public CountryCode: string;

    /// <summary>
    /// The package source.
    /// </summary>
    public Source: PackageSource;

    /// <summary>
    /// Package metadata (NuSpec).
    /// </summary>
    public PackageMetadata: NuSpec | null;

    constructor(
        PackageID: string | null = null,
        ID: string | null,
        MinimumVersion: string | null = null,
        Version: string,
        Name: string,
        Description: string,
        Publisher: string,
        CountryCode: string,
        Source: PackageSource,
        PackageMetadata: NuSpec | null = null
    ) {
        if (PackageID === null) {
            PackageID = `${Publisher}.${Name}.symbols.${ID}`.replaceAll(" ", "");

            if (PackageID.length > 100) {
                PackageID = `${Publisher}.${Name}`
                    .replaceAll(" ", "")
                    .substring(0, 100 - 36 - 9);
                PackageID += `.symbols.${ID}`;
            }
        }
        this.PackageID = PackageID;
        this.ID = ID;
        this.MinimumVersion = MinimumVersion;
        this.Version = Version;
        this.Name = Name;
        this.Description = Description;
        this.Publisher = Publisher;
        this.CountryCode = CountryCode;
        this.Source = Source;
        this.PackageMetadata = PackageMetadata;
    }
}