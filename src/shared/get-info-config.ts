/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join } from 'path';
import { readJson } from 'fs-extra';
import { PJSON } from '@oclif/config';
import { get } from '@salesforce/ts-types';

interface PjsonWithInfo extends PJSON {
  oclif: PJSON['oclif'] & {
    info: InfoConfig;
  };
}

export interface InfoConfig {
  releasenotes: {
    distTagUrl: string;
    releaseNotesPath: string;
    releaseNotesFilename: string;
  };
}

/* sfdx example to add to cli pjson.oclif

location with npm install:
~/.nvm/versions/node/v14.17.5/lib/node_modules/sfdx-cli/package.json

Add to oclif object
"info": {
  "releasenotes": {
    "distTagUrl": "https://registry.npmjs.org/-/package/sfdx-cli/dist-tags",
    "releaseNotesPath": "https://raw.githubusercontent.com/forcedotcom/cli/main/releasenotes/sfdx",
    "releaseNotesFilename": "README.md"
  }
}
*/

export async function getInfoConfig(root: string): Promise<InfoConfig> {
  const fullPath = join(root, 'package.json');

  const json = (await readJson(fullPath)) as PjsonWithInfo;

  const info = get(json, 'oclif.info') as InfoConfig;

  if (!info) throw new Error('getInfoConfig() failed to find pjson.oclif.info config');

  return info;
}
