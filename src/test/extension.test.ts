import * as assert from 'assert';
import * as vscode from 'vscode';

import * as ALGet from '../extension';
import { ALGetController } from '../Controller/ALGetController';
import { AppSourcePackageSource } from '../Package/PackageSource/NuGet/MSFT/AppSourcePackageSource';
import { CustomFeed } from '../Package/PackageSource/NuGet/CustomFeed';
import { NuGetVersion } from '../Package/PackageSource/NuGet/NuGetVersion';

suite('ALGet Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('ALGet initialization test', () => {
		// TODO: check if ALGetController is initialized correctly
		// initialize ALGetController
		//const alGet = new ALGetController(undefined);
		
		// // check if package sources are registered
		// assert.equal(alGet.PackageSources.length, 3, 'Number of registered package sources is not correct');
		// // check for specific package sources
		// assert.notEqual(
		// 	alGet.PackageSources.find((source) => source.Name === 'MS Symbols'),
		// 	undefined,
		// 	'MS Symbols package source not found'
		// );
		// assert.notEqual(
		// 	alGet.PackageSources.find((source) => source.Name === 'MS Apps'),
		// 	undefined,
		// 	'MS Apps package source not found'
		// );
		// assert.notEqual(
		// 	alGet.PackageSources.find((source) => source.Name === 'AppSource Symbols'),
		// 	undefined,
		// 	'AppSource Symbols package source not found'
		// );
	});

	test('Find package in NuGet package source test', async () => {
		// Specify the package name to search for
		const packageName = '365 business Print Agent';

		// Create an instance of the AppSourcePackageSource class
		const appSource = new AppSourcePackageSource();

		// Call the getPackageByName method to search for the package
		const pkgResponse = await appSource.getPackageByName(packageName, false);

		// Check if the package was found
		let pkg = null;
		if (pkgResponse.length) {
			pkg = pkgResponse[0];
		} else {
			pkg = pkgResponse;
		}

		// Check if the expected package was found
		assert.equal(
			pkg.title,
			packageName,
			`AppSource package '${packageName}' not found`
		);
	});

	test('NuGet Package ID generation test', () => {
		// Create an instance of the AppSourcePackageSource class
		const appSource = new AppSourcePackageSource();

		// Call the getPackageId method to generate the package ID
		const packageId = appSource.getPackageId(
			'365 business development',
			'365 business Print Agent',
			'00000000-0000-0000-0000-000000000000');

		// Check if the package ID was generated correctly
		assert.equal(
			packageId,
			'365businessdevelopment.365businessPrintAgent.symbols.00000000-0000-0000-0000-000000000000',
			`Package ID not generated correctly`
		);

		// Call the getPackageId method to generate the package ID which exceeds the length limit
		const longPackageId = appSource.getPackageId(
			'365 business development',
			'365 business development Extension License',
			'00000000-0000-0000-0000-000000000000');

		// Check if the package ID length exceeds the limit
		assert.notEqual(
			longPackageId.length > 100,
			true,
			`Package ID length exceeds the limit`
		);

		// Check if the package ID was generated correctly
		assert.equal(
			longPackageId,
			'365businessdevelopment.365businessdevelopmentExtensionL.symbols.00000000-0000-0000-0000-000000000000',
			`Package ID not generated correctly`
		);
	});

	test('Find package in private NuGet package source test', async () => {
		// TODO: Testing private NuGet feeds takes a lot of time, so it is disabled for now
		
		// // Specify the package name to search for
		// const packageName = '365 business E-Invoice';

		// // Create an instance of the CustomFeed class
		// const unauthorizedCustomFeed = new CustomFeed(
		// 	'Private NuGet Feed',
		// 	'https://pkgs.dev.azure.com/365businessdev/f4e0cb78-8f02-4f52-8194-a606c283777d/_packaging/nuget-test/nuget/v3/index.json'
		// );

		// // Expect an error to be thrown for unauthorized access to the private NuGet feed
		// await assert.rejects(
		// 	async () => {
		// 		await unauthorizedCustomFeed.getPackageByName(packageName, false);
		// 	},
		// 	(error: Error) => {
		// 		assert.equal(error.message, 'Unauthorized attempt to access the resource');
		// 		return true;
		// 	},
		// 	`Expected error not thrown for unauthorized access to private NuGet feed`
		// );

		// // Set the personal access token (PAT) for the private NuGet feed
		// const pkgSourcePAT = 'FKhBH0k30HE1wprYQwVONCK4qH7TFZNIFfCUNWTAmHcQ8FqTiOZjJQQJ99BBACAAAAAdIp0wAAASAZDO8D5z';

		// // Create an instance of the CustomFeed class with the PAT authentication
		// const customFeed = new CustomFeed(
		// 	'Private NuGet Feed',
		// 	'https://pkgs.dev.azure.com/365businessdev/f4e0cb78-8f02-4f52-8194-a606c283777d/_packaging/nuget-test/nuget/v3/index.json',
		// 	CustomFeed.getAuthenticationHeaderFromPAT(pkgSourcePAT)
		// );

		// // Call the getPackageByName method to search for the package
		// const pkgResponse = await customFeed.getPackageByName(packageName, false);

		// // Check if the package was found
		// let pkg = null;
		// if (pkgResponse.length) {
		// 	pkg = pkgResponse[0];
		// } else {
		// 	pkg = pkgResponse;
		// }

		// assert.equal(
		// 	pkg.title,
		// 	packageName,
		// 	`Custom feed package '${packageName}' not found`
		// );
	});

	test('Test NuGet version range parsing', () => {
		// Test minimum version, inclusive
		let version = NuGetVersion.parse('1.0.0.0');
		assert.equal(version!.minVersion, '1.0.0.0', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, true, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, false, 'Exact version isMaxInclusive is not correct');

		// Test minimum version, inclusive
		version = NuGetVersion.parse('[1.0.0.0,)');
		assert.equal(version!.minVersion, '1.0.0.0', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, true, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, false, 'Exact version isMaxInclusive is not correct');
	
		// Test minimum version, exclusive
		version = NuGetVersion.parse('(1.0.0.0,)');
		assert.equal(version!.minVersion, '1.0.0.0', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, false, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, false, 'Exact version isMaxInclusive is not correct');

		// Test exact version
		version = NuGetVersion.parse('[1.0.0.0]');
		assert.equal(version!.minVersion, '1.0.0.0', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '1.0.0.0', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, true, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, true, 'Exact version isMaxInclusive is not correct');

		// Test maximum version, inclusive
		version = NuGetVersion.parse('(,1.0.0.0]');
		assert.equal(version!.minVersion, '', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '1.0.0.0', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, false, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, true, 'Exact version isMaxInclusive is not correct');

		// Test maximum version, exclusive
		version = NuGetVersion.parse('(,1.0.0.0)');
		assert.equal(version!.minVersion, '', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '1.0.0.0', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, false, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, false, 'Exact version isMaxInclusive is not correct');

		// Test exact range, inclusive
		version = NuGetVersion.parse('[1.0.0.0,2.0.0.0]');
		assert.equal(version!.minVersion, '1.0.0.0', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '2.0.0.0', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, true, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, true, 'Exact version isMaxInclusive is not correct');

		// Test exact range, exclusive
		version = NuGetVersion.parse('(1.0.0.0,2.0.0.0)');
		assert.equal(version!.minVersion, '1.0.0.0', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '2.0.0.0', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, false, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, false, 'Exact version isMaxInclusive is not correct');

		// Test mixed inclusive minimum and exclusive maximum version
		version = NuGetVersion.parse('[1.0.0.0,2.0.0.0)');
		assert.equal(version!.minVersion, '1.0.0.0', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '2.0.0.0', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, true, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, false, 'Exact version isMaxInclusive is not correct');

		// Test mixed inclusive minimum and exclusive maximum version
		version = NuGetVersion.parse('(1.0.0.0,2.0.0.0]');
		assert.equal(version!.minVersion, '1.0.0.0', 'Exact version minVersion is not correct');
		assert.equal(version!.maxVersion, '2.0.0.0', 'Exact version maxVersion is not correct');
		assert.equal(version!.isMinInclusive, false, 'Exact version isMinInclusive is not correct');
		assert.equal(version!.isMaxInclusive, true, 'Exact version isMaxInclusive is not correct');
	});

	test('Test NuGet version comparison', () => {
		let version = NuGetVersion.parse('1.0.0.0');
		assert.equal(
			version!.isInRange('0.0.0.4'),
			false,
			'Version should not be in range'
		);

		assert.equal(
			version!.isInRange('1.0.0.0'),
			true,
			'Version should be in range'
		);

		assert.equal(
			version!.isInRange('1.0.0.1'),
			true,
			'Version should be in range'
		);

		assert.equal(
			version!.isInRange('2.0.0.0'),
			true,
			'Version should be in range'
		);
	});
});
