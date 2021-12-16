/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { marked } from 'marked';
import * as semver from 'semver';

const parseReleaseNotes = (notes: string, version: string, baseUrl: string): marked.Token[] => {
  let found = false;
  let findClosest = false;
  let closestVersion: string;
  const versions = [];

  const parsed = marked.lexer(notes);

  let tokens: marked.Token[];

  const findVersion = (desiredVersion: string): void => {
    tokens = parsed.filter((token) => {
      // TODO: Could make header depth (2) a setting in oclif.info.releasenotes
      if (token.type === 'heading' && token.depth === 2) {
        const coercedVerion = semver.coerce(token.text).version;

        // First time through, build an array of versions
        // We will use this to find the closest patch if passed version is not found
        if (!findClosest) versions.push(coercedVerion);

        if (coercedVerion === desiredVersion) {
          found = true;

          return token;
        }

        found = false;
      } else if (found === true) {
        return token;
      }
    });

    if (!tokens.length) {
      if (findClosest === false) {
        findClosest = true;

        const semverRange = `${semver.major(version)}.${semver.minor(version)}.x`;
        // Version was not found, try again with the closest patch version
        closestVersion = semver.maxSatisfying(versions, semverRange) as string;

        findVersion(closestVersion);
      } else {
        throw new Error(`Didn't find version '${version}'. View release notes online at: ${baseUrl}`);
      }
    }
  };

  findVersion(version);

  const fixRelativeLinks = (token: marked.Token): void => {
    // If link is relative, add the baseurl. https://regex101.com/r/h802kJ/1
    // FWIW: 'marked' does have a 'baseURL' option, but the 'marked-terminal' renderer does not honor it
    if (token.type === 'link' && !token.href.match(/(?:[a-z][a-z0-9+.-]*:|\/\/)/gi)) {
      token.href = `${baseUrl}/${token.href}`;
    }
  };

  marked.walkTokens(tokens, fixRelativeLinks);

  if (findClosest) {
    const warning = marked.lexer(
      `# ATTENTION: Version ${version} was not found. Showing notes for closest patch version ${closestVersion}.`
    )[0];

    tokens.unshift(warning);
  }

  return tokens;
};

export { parseReleaseNotes };
