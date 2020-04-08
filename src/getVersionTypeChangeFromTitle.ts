import { VersionType } from "./types";

export const getVersionTypeChangeFromTitle = (title: string): VersionType => {
    const VERSIONS_REGEX = /[0-9.]+/g;
    const versions = title.match(VERSIONS_REGEX);
    if (versions.length !== 2) {
      throw new Error(`Expected two versions in PR title "${title}"`);
    }

    const [previousVersion, nextVersion] = versions;

    const parsedPrevious = previousVersion.split('.').map(Number)
    const parsedNext = previousVersion.split('.').map(Number)

    if (parsedPrevious.length !== 3) {
      throw new Error(`Expected previous version to be in format X.X.X. Found "${previousVersion}"`);
    }
    if (parsedNext.length !== 3) {
      throw new Error(`Expected next version to be in format X.X.X. Found "${nextVersion}"`);
    }

    if (previousVersion[0] >= nextVersion[0] && previousVersion[1] >= nextVersion[1] && previousVersion[2] >= nextVersion[2]) {
      throw new Error(`Expected previous version to be smaller in PR title "${title}"`);
    }

    if (parsedNext[0] > parsedPrevious[0]) {
      return 'MAJOR';
    }

    if (parsedNext[1] > parsedPrevious[1]) {
      return 'MINOR'
    }

    if (parsedNext[2] > parsedPrevious[2]) {
      return 'PATCH'
    }

    throw new Error(`Unexpected case for title ${title}`);
}