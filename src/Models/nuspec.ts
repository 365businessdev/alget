/// <summary>
/// Represents a NuSpec file.
/// </summary>
export class NuSpec {
    id: string;
    version: string;
    title?: string;
    authors: string;
    owners?: string;
    licenseUrl?: string;
    projectUrl?: string;
    iconUrl?: string;
    requireLicenseAcceptance: boolean;
    description: string;
    releaseNotes?: string;
    copyright?: string;
    tags?: string;
    dependencies?: Dependency[];
    versions?: Versions[];

    constructor(
        id: string,
        version: string,
        authors: string,
        requireLicenseAcceptance: boolean = true,
        description: string,
        title?: string,
        owners?: string,
        licenseUrl?: string,
        projectUrl?: string,
        iconUrl?: string,
        releaseNotes?: string,
        copyright?: string,
        tags?: string,
        dependencies?: Dependency[]
    ) {
        this.id = id;
        this.version = version;
        this.title = title;
        this.authors = authors;
        this.owners = owners;
        this.licenseUrl = licenseUrl;
        this.projectUrl = projectUrl;
        this.iconUrl = iconUrl;
        this.requireLicenseAcceptance = requireLicenseAcceptance;
        this.description = description;
        this.releaseNotes = releaseNotes;
        this.copyright = copyright;
        this.tags = tags;
        this.dependencies = dependencies;
    }
}

export class Dependency {
    id: string;
    version: string;

    constructor(id: string, version: string) {
        this.id = id;
        this.version = version;
    }
}

export interface Versions {
    id: string;
    downloads: number;
    version: string;
}