import * as core from '@actions/core'
import { GitHub, context } from '@actions/github'
import { WebhookPayloadCheckSuite } from '@octokit/webhooks'
import { VersionType, InputParams } from './types';
import { getVersionTypeChangeFromTitle } from './getVersionTypeChangeFromTitle';
import { deploy } from './deploy';

const VERSION_TYPES = ['PATCH', 'MINOR', 'MAJOR'];
const DEPENDABOT_BRANCH_PREFIX = 'dependabot-npm_and_yarn-';
const EXPECTED_CONCLUSION = 'success';
const DEPENDABOT_LABEL = 'in-progress'

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

const run = async (payload: WebhookPayloadCheckSuite): Promise<void> => {
  const input = getInputParams();
  const client = new GitHub(input.gitHubToken);

  const isSuccess = payload.check_suite.conclusion === EXPECTED_CONCLUSION;
  if (!isSuccess) {
    console.log('Branch check suite run was not successful, skipping');
    return;
  }

  const pullRequest = payload.check_suite.pull_requests.find(e => e.head.ref.startsWith(DEPENDABOT_BRANCH_PREFIX));
  if (!pullRequest) {
    console.log('Branch for dependabot not found, skipping');
    return;
  }

  const pullRequestData = await client.pulls.get({
      owner: context.repo.owner,
      pull_number: pullRequest.number,
      repo: pullRequest.head.repo.name,
  })


  const versionChangeType = getVersionTypeChangeFromTitle(pullRequestData.data.title);

  if (!shouldDeployVersion(versionChangeType, input.maxDeployVersion)) {
      console.log(`Skipping deploy for version type ${versionChangeType}. Running with maxDeployVersion ${input.maxDeployVersion}`);
      return;
   }

   const labels = pullRequestData.data.labels.map(e => e.name);
   if (!shouldDeployLabel(labels)) {
     console.log(`Skipping deploy. PRs with Labels "${labels}" should not be deployed`);
     return;
   }

  await deploy(pullRequest.number, context, client);
}

try {
  console.log(JSON.stringify(context));
  if (context.eventName === 'check_suite') {
    run(context.payload as WebhookPayloadCheckSuite);
  }
  else {
    console.log(`Not running for event ${context.eventName} and action ${context.action}`)
  }
} catch (error) {
  core.setFailed(error.message);
}