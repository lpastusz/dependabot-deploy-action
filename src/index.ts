import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'
import { WebhookPayloadPullRequest } from '@octokit/webhooks'
import { VersionType, InputParams } from './types';
import { getVersionTypeChangeFromTitle } from './getVersionTypeChangeFromTitle';
import { deploy } from './deploy';

const VERSION_TYPES = ['PATCH', 'MINOR', 'MAJOR'];

const getInputParams = (): InputParams => {
  const deployDevDependencies = Boolean(core.getInput('deployDevDependencies'));
  const deployDependencies = Boolean(core.getInput('deployDependencies'));
  const gitHubToken = core.getInput('gitHubToken') as string;
  const maxDeployVersion = core.getInput('maxDeployVersion').toUpperCase() as VersionType;

  if (!VERSION_TYPES.includes(maxDeployVersion)) {
    throw new Error(`Unexpected input for maxDeployVersion ${maxDeployVersion}`);
  }

  return {
    deployDevDependencies,
    deployDependencies,
    gitHubToken,
    maxDeployVersion,
  };
}

const shouldDeployVersion = (versionChangeType: VersionType, maxDeployVersion: VersionType): boolean => {
  const versionIndex = VERSION_TYPES.indexOf(versionChangeType);
  const maxVersionIndex = VERSION_TYPES.indexOf(maxDeployVersion);

  return versionIndex <= maxVersionIndex;
}

const run = async (payload: WebhookPayloadPullRequest): Promise<void> => {
  const input = getInputParams();
  const client = new GitHub(input.gitHubToken);

  const versionChangeType = getVersionTypeChangeFromTitle(payload.pull_request.title);

  const shouldDeploy = shouldDeployVersion(versionChangeType, input.maxDeployVersion);
  if (!shouldDeploy) {
      console.log(`Skipping deploy for version type ${versionChangeType}. Running with maxDeployVersion ${input.maxDeployVersion}`);
      return;
   }

  await deploy(payload, context, client);
}

try {
  if (context.eventName === 'pull_request') {
    run(context.payload as WebhookPayloadPullRequest);
  }
  else {
    throw new Error(`Unexpected eventName ${context.eventName}`);
  }
} catch (error) {
  core.setFailed(error.message);
}