import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'
import { WebhookPayloadStatus } from '@octokit/webhooks'
import { VersionType, InputParams } from './types';
import { getVersionTypeChangeFromTitle } from './getVersionTypeChangeFromTitle';
import { deploy } from './deploy';
import { isSuccessStatusCode } from './utils';

const VERSION_TYPES = ['PATCH', 'MINOR', 'MAJOR'];
const DEPENDABOT_BRANCH_PREFIX = 'dependabot-npm_and_yarn-';
const EXPECTED_CONCLUSION = 'success';
const EXPECTED_CONTEXT = 'continuous-integration/codeship';
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

const run = async (payload: WebhookPayloadStatus): Promise<void> => {
  const input = getInputParams();
  const client = new GitHub(input.gitHubToken);

  if (payload.context !== EXPECTED_CONTEXT) {
    console.log('Context is not codeship, skipping');
    return;
  }

  const isSuccess = payload.state === EXPECTED_CONCLUSION;
  if (!isSuccess) {
    console.log('status is not success, skipping');
    return;
  }

  const branch = payload.branches.find(e => e.name.startsWith(DEPENDABOT_BRANCH_PREFIX));
  if (!branch) {
    console.log('Branch for dependabot not found, skipping');
    return;
  }

  const pullRequests = await client.pulls.list({
    direction: 'desc',
    sort: 'updated',
    state: 'open',
    repo: context.repo.repo,
    owner: context.repo.owner,
  })

  if (!isSuccessStatusCode(pullRequests.status)) {
    throw new Error('PRs could not be listed');
  }

  const pullRequest = pullRequests.data.find(e => e.head.sha === branch.commit.sha)

  if (!pullRequest) {
    throw new Error('No PR returned');
  }

  const versionChangeType = getVersionTypeChangeFromTitle(pullRequest.title);

  if (!shouldDeployVersion(versionChangeType, input.maxDeployVersion)) {
      console.log(`Skipping deploy for version type ${versionChangeType}. Running with maxDeployVersion ${input.maxDeployVersion}`);
      return;
   }

   const labels = pullRequest.labels.map(e => e.name);
   if (!shouldDeployLabel(labels)) {
     console.log(`Skipping deploy. PRs with Labels "${labels}" should not be deployed`);
     return;
   }

  await deploy(pullRequest.number, context, client);
}

try {
  if (context.eventName === 'status') {
    run(context.payload as WebhookPayloadStatus);
  }
  else {
    console.log(`Not running for event ${context.eventName} and action ${context.action}`)
  }
} catch (error) {
  core.setFailed(error.message);
}