/// <summary>
/// Represents the version range.
/// </summary>
export class VersionRange {

    public minVersion: string;
    public maxVersion: string;
    public isMinInclusive: boolean;
    public isMaxInclusive: boolean;

    constructor(minVersion: string, maxVersion: string, isMinInclusive: boolean, isMaxInclusive: boolean) {
        this.minVersion = minVersion;
        this.maxVersion = maxVersion;
        this.isMinInclusive = isMinInclusive;
        this.isMaxInclusive = isMaxInclusive;
    }
}