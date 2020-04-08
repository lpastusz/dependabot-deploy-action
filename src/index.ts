import * as core from '@actions/core'
import * as github from '@actions/github'
import * as Webhooks from '@octokit/webhooks'

const GitHub = github.GitHub;
const context = github.context;

const run = async (payload: Webhooks.WebhookPayloadPullRequest): Promise<void> => {
    const deployDevDependencies = Boolean(core.getInput('deployDevDependencies'));
    const deployDependencies = Boolean(core.getInput('deployDependencies'));
    const gitHubToken = core.getInput('gitHubToken') as string;

    const gitHub = new GitHub(gitHubToken);

    const result = await gitHub.pulls.createReview({
      event: 'APPROVE',
      pull_number: payload.pull_request.number,
      owner: context.repo.owner,
      repo: context.repo.repo
    })

    console.log(JSON.stringify(result, null, 2));

    console.log(deployDevDependencies, deployDependencies)
}

try {
  console.log(JSON.stringify(context, null, 2));

  if (context.eventName === 'pull_request') {
    run(context.payload as Webhooks.WebhookPayloadPullRequest);
  }
  else {
    throw new Error(`Unexpected eventName ${context.eventName}`);
  }
} catch (error) {
  core.setFailed(error.message);
}