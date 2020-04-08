export type VersionType = 'PATCH' | 'MINOR' | 'MAJOR';

export interface InputParams {
    deployDevDependencies: boolean;
    deployDependencies: boolean;
    gitHubToken: string;
    maxDeployVersion: VersionType;
  }