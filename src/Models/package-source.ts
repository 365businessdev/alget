/// <summary>
/// Represents a package source.
/// </summary>
export class PackageSource {

  /// <summary>
  /// The name of the package source.
  /// </summary
  public name: string;

  /// <summary>
  /// The URL of the package source.
  /// </summary>
  public url?: string;

  /// <summary>
  /// The schema of the package ID.
  /// </summary>
  packageIDSchema: string = "";

  /// <summary>
  /// The API key or Personal Access Token (PAT), if required.
  /// </summary>
  public apiKey?: string;

  constructor(name: string, url?: string, packageIDSchema?: string, apiKey?: string) {
    this.name = name;
    this.url = url;
    if (packageIDSchema !== undefined) {
      this.packageIDSchema = packageIDSchema;
    }
    this.apiKey = apiKey;
  }
}
