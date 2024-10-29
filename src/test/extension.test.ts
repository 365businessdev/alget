// import * as assert from 'assert';

// import * as vscode from 'vscode';
// import { Package } from '../Models/package';

// import * as alManifest from '../Common/manifest';
// import * as fetchPackages from '../NuGet/fetchPackages';

// suite('Extension Test Suite', () => {
// 	vscode.window.showInformationMessage('Start all tests.');

// 	test('Get Package Cache From Manifest', async () => {
// 		let packages: Package[] = await alManifest.getPackageCacheFromManifest(
// 			JSON.parse(`{
//   "id": "c08b650d-df79-41a2-a219-6718cbbbf1e2",
//   "name": "365 business Print Agent.Test",
//   "publisher": "365 business development",
//   "version": "18.5.0.0",
//   "brief": "Test app for 365 business Print Agent.",
//   "description": "Test app for 365 business Print Agent.",
//   "privacyStatement": "https://www.365businessdev.com/datenschutzerklaerung/",
//   "EULA": "https://www.365businessdev.com/365-business-api-license-agreement-eula/",
//   "help": "https://www.365businessdev.com/kontakt/",
//   "url": "https://www.365businessdev.com/",
//   "logo": "res/logo.png",
//   "dependencies": [
//     {
//       "id": "6fb30c19-f5d6-4e4c-b006-18fba4de1898",
//       "name": "365 business Print Agent",
//       "publisher": "365 business development",
//       "version": "18.0.0.0"
//     },
//     {
//       "id": "9856ae4f-d1a7-46ef-89bb-6ef056398228",
//       "publisher": "Microsoft",
//       "name": "System Application Test Library",
//       "version": "15.0.0.0"
//     },
//     {
//       "id": "5d86850b-0d76-4eca-bd7b-951ad998e997",
//       "publisher": "Microsoft",
//       "name": "Tests-TestLibraries",
//       "version": "15.0.0.0"
//     },
//     {
//       "id": "dd0be2ea-f733-4d65-bb34-a28f4624fb14",
//       "publisher": "Microsoft",
//       "name": "Library Assert",
//       "version": "15.0.0.0"
//     }
//   ],
//   "screenshots": [],
//   "platform": "18.0.0.0",
//   "application": "18.0.0.0",
//   "idRanges": [
//     {
//       "from": 62090,
//       "to": 62099
//     }
//   ],
//   "contextSensitiveHelpUrl": "https://docs.365businessdev.com/{0}/365-business-print-agent",
//   "supportedLocales": [
//     "en-US",
//     "de-DE"
//   ],
//   "showMyCode": true,
//   "runtime": "7.0"
// }`)
// 		);

// 		packages.forEach((pkg: Package) => {
//       		console.log(`Package ID: ${pkg.ID}`);
// 			console.log(`Version: ${pkg.Version}`);
// 			console.log(`Name: ${pkg.Name}`);
// 			console.log(`Publisher: ${pkg.Publisher}`);
// 			console.log('---------------------------');
// 		});
// 	});

// 	test('Fetch Print Agent from AppSource Feed', () =>{
// 		let MSSymbolsFeed = "https://dynamicssmb2.pkgs.visualstudio.com/DynamicsBCPublicFeeds/_packaging/MSSymbols/nuget/v3/index.json";
// 		let AppSourceSymbolsFeed = "https://dynamicssmb2.pkgs.visualstudio.com/DynamicsBCPublicFeeds/_packaging/AppSourceSymbols/nuget/v3/index.json";

// 		let packageName = `365 business development.365 business Print Agent.symbols.6fb30c19-f5d6-4e4c-b006-18fba4de1898`.replaceAll(' ', '');

// 		let packages = fetchPackages.fetchPackagesFromFeed(
// 			AppSourceSymbolsFeed,
// 			packageName,
// 			false
// 		);

// 		packages.then((data) => {
// 			assert.equal(data[0].id, packageName.replaceAll(' ', ''));
// 			assert.notEqual(data[0].version, '');
// 		});
// 	});
// });
