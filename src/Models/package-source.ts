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
  /// The authorization header, if required.
  /// </summary>
  public authorizationHeader?: string;

  constructor(name: string, url?: string, packageIDSchema?: string, authorizationHeader?: string) {
    this.name = name;
    this.url = url;
    if (packageIDSchema !== undefined) {
      this.packageIDSchema = packageIDSchema;
    }
    this.authorizationHeader = authorizationHeader;
  }
}
