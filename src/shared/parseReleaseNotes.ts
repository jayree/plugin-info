/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { marked } from 'marked';

const parseReleaseNotes = (notes: string, version: string, baseUrl: string): marked.Token[] => {
  let found = false;

  const parsed = marked.lexer(notes);

  // https://stackoverflow.com/a/6969486
  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  };

  const regexp = new RegExp(`\\b${escapeRegExp(version)}\\b`);

  const tokens = parsed.filter((token) => {
    // TODO: Could make header depth (2) a setting in oclif.info.releasenotes
    if (token.type === 'heading' && token.depth === 2) {
      if (regexp.exec(token.text)) {
        found = true;

        return token;
      }

      found = false;
    } else if (found === true) {
      return token;
    }
  });

  if (!tokens.length) {
    throw new Error(`Didn't find version '${version}'. View release notes online at: ${baseUrl}`);
  }

  const fixRelativeLinks = (token: marked.Token): void => {
    // If link is relative, add the baseurl. https://regex101.com/r/h802kJ/1
    // FWIW: 'marked' does have a 'baseURL' option, but the 'marked-terminal' renderer does not honor it
    if (token.type === 'link' && !token.href.match(/(?:[a-z][a-z0-9+.-]*:|\/\/)/gi)) {
      token.href = `${baseUrl}/${token.href}`;
    }
  };

  marked.walkTokens(tokens, fixRelativeLinks);

  return tokens;
};

export { parseReleaseNotes };
