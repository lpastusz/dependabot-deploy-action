import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'
import { WebhookPayloadPullRequest } from '@octokit/webhooks'
import { VersionType, InputParams } from './types';
import { getVersionTypeChangeFromTitle } from './getVersionTypeChangeFromTitle';
import { deploy } from './deploy';

const VERSION_TYPES = ['PATCH', 'MINOR', 'MAJOR'];
const DEPENDABOT_BRANCH_PREFIX = 'dependabot-npm_and_yarn-';
const DEPENDABOT_LABEL = 'dependencies'

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

const shouldDeployBranch = (branchName: string): boolean => {
  return branchName.startsWith(DEPENDABOT_BRANCH_PREFIX);
}

const shouldDeployLabel = (labels: string[]): boolean => {
  return labels.includes(DEPENDABOT_LABEL);
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

  if (!shouldDeployVersion(versionChangeType, input.maxDeployVersion)) {
      console.log(`Skipping deploy for version type ${versionChangeType}. Running with maxDeployVersion ${input.maxDeployVersion}`);
      return;
   }

   const branchName = payload.pull_request.head.ref;
   if (!shouldDeployBranch(branchName)) {
     console.log(`Skipping deploy for branch ${branchName}. Branch is not created by dependabot`);
     return;
   }

   const labels = payload.pull_request.labels;
   if (!shouldDeployLabel(labels)) {
     console.log(`Skipping deploy. PRs with Labels ${labels} should not be deployed`);
     return;
   }

  await deploy(payload, context, client);
}

try {
  if (context.eventName === 'pull_request') {
    console.log(JSON.stringify(context));
    run(context.payload as WebhookPayloadPullRequest);
  }
  else {
    throw new Error(`Unexpected eventName ${context.eventName}`);
  }
} catch (error) {
  core.setFailed(error.message);
}