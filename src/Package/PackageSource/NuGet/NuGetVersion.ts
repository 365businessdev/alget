/// <summary>
/// Represents a NuGet version range.
/// </summary>
/// <seealso href="https://docs.microsoft.com/en-us/nuget/concepts/package-versioning#version-ranges"/>
export class NuGetVersion {
    /// <summary>
    /// Minimum version in the range.
    /// </summary>
    public minVersion: string;

    /// <summary>
    /// Maximum version in the range.
    /// </summary>
    public maxVersion: string;

    /// <summary>
    /// Indicates if the minimum version is inclusive.
    /// </summary>
    public isMinInclusive: boolean;

    /// <summary>
    /// Indicates if the maximum version is inclusive.
    /// </summary>
    public isMaxInclusive: boolean;

    /// <summary>
    /// Initializes a new instance of the <see cref="NuGetVersion"/> class.
    /// </summary>
    constructor(minVersion: string, maxVersion: string, isMinInclusive: boolean, isMaxInclusive: boolean) {
        this.minVersion = minVersion;
        this.maxVersion = maxVersion;
        this.isMinInclusive = isMinInclusive;
        this.isMaxInclusive = isMaxInclusive;
    }

    /// <summary>
    /// Parses a NuGet version range string into a NuGetVersion object
    /// </summary>
    public static parse(range: string): NuGetVersion | null {
        // Handle min. version, inclusive
        if ((range.split('.').length === 4) && (!range.startsWith('[')) && (!range.endsWith(']')) && (!range.startsWith('(')) && (!range.endsWith(')')) && (range.indexOf(',') === -1)) {
            return new NuGetVersion(range, '', true, false);  
        }
        // Handle simple min. version
        if ((/^\d+\.\d+(\.\d+)?(\.\d+)?$/.test(range))) {
            const version = range;
            const parts = version.split('.');
            while (parts.length < 4) {
                parts.push('0');
            }
            const fullVersion = parts.join('.');
            return new NuGetVersion(fullVersion, '', true, false);
        }
        // Handle exact version
        if (/^\[\d+\.\d+(\.\d+)?(\.\d+)?\]$/.test(range))  {
            const version = range.replace(/[\[\]]/g, ''); // Remove brackets if present
            const parts = version.split('.');
            while (parts.length < 4) {
                parts.push('0');
            }
            const fullVersion = parts.join('.');
            return new NuGetVersion(fullVersion, fullVersion, true, true);
        }
    
        // Handle ranges with brackets and parentheses
        const rangeRegex = /^[\[\(](.*?),(.*?)[\]\)]$/;
        const match = range.match(rangeRegex);
    
        if (!match) {
            return null;
        }
    
        return new NuGetVersion(
            match[1].trim(),
            match[2].trim(),
            range.startsWith('['),
            range.endsWith(']')
        );
    }

    /// <summary>
    /// Checks if the specified version is within the NuGet version range.
    /// </summary>
    public isInRange(version: string): boolean {
        switch (true) {
            case ((this.minVersion === this.maxVersion) && (this.isMinInclusive) && (this.isMaxInclusive)):
              return (version === this.minVersion);
            case ((this.minVersion === this.maxVersion) && (this.isMinInclusive) && (!this.isMaxInclusive)):
              return (version > this.minVersion);
            case ((this.minVersion === this.maxVersion) && (!this.isMinInclusive) && (this.isMaxInclusive)):
              return (version < this.minVersion);
            case ((this.minVersion === this.maxVersion) && (!this.isMinInclusive) && (!this.isMaxInclusive)):
              return (version !== this.minVersion);
            case ((this.minVersion !== this.maxVersion) && (this.maxVersion !== "") && (this.isMinInclusive) && (this.isMaxInclusive)):
              return (version >= this.minVersion && version <= this.maxVersion);
            case ((this.minVersion !== this.maxVersion) && (this.maxVersion !== "") && (this.isMinInclusive) && (!this.isMaxInclusive)):
              return (version >= this.minVersion && version < this.maxVersion);
            case ((this.minVersion !== this.maxVersion) && (this.maxVersion !== "") && (!this.isMinInclusive) && (this.isMaxInclusive)):
              return (version > this.minVersion && version <= this.maxVersion);
            case ((this.minVersion !== this.maxVersion) && (this.maxVersion !== "") && (!this.isMinInclusive) && (!this.isMaxInclusive)):
              return (version > this.minVersion && version < this.maxVersion);
            case ((this.maxVersion === "") && (!this.isMinInclusive)):
              return (version > this.minVersion);
            case ((this.maxVersion === "") && (this.isMinInclusive)):
              return (version >= this.minVersion);
            case ((this.minVersion === "") && (!this.isMaxInclusive)):
              return (version < this.minVersion);
            case ((this.minVersion === "") && (this.isMaxInclusive)):
              return (version <= this.minVersion);
        }

        return false;
    }
}