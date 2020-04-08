import { VersionType } from "./types";

export const getVersionTypeChangeFromTitle = (title: string): VersionType => {
    const VERSIONS_REGEX = /[0-9.]+/g;
    const versions = title.match(VERSIONS_REGEX);
    if (versions.length !== 2) {
      throw new Error(`Expected two versions in PR title "${title}"`);
    }

    const previous = versions[0].split('.').map(Number)
    const next = versions[1].split('.').map(Number)

    if (previous.length !== 3) {
      throw new Error(`Expected previous version to be in format X.X.X. Found "${versions[0]}"`);
    }
    if (next.length !== 3) {
      throw new Error(`Expected next version to be in format X.X.X. Found "${versions[1]}"`);
    }

    if (previous[0] >= next[0] && previous[1] >= next[1] && previous[2] >= next[2]) {
      throw new Error(`Expected previous version to be smaller in PR title "${title}"`);
    }

    if (next[0] > previous[0]) {
      return 'MAJOR';
    }

    if (next[1] > previous[1]) {
      return 'MINOR'
    }

    if (next[2] > previous[2]) {
      return 'PATCH'
    }

    throw new Error(`Unexpected case for title ${title}`);
}