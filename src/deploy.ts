import { GitHub } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { isSuccessStatusCode } from "./utils";

const LABEL_NAME = 'ready-for-deploy';

export const deploy = async (pullRequestNumber: number, context: Context, client: GitHub): Promise<void> => {
    const createReview = client.pulls.createReview({
      event: 'APPROVE',
      pull_number: pullRequestNumber,
      owner: context.repo.owner,
      repo: context.repo.repo
    })
  
    const addLabel = client.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pullRequestNumber,
      labels: [LABEL_NAME],
    })
  
    const [createReviewResult, addLabelResult] = await Promise.all([createReview, addLabel]);
  
    if (!isSuccessStatusCode(createReviewResult.status)) {
      throw new Error(`Review could not be created. ${JSON.stringify(createReviewResult)}`)
    }
  
    if (!isSuccessStatusCode(addLabelResult.status)) {
      throw new Error(`Label could not be added. ${JSON.stringify(addLabel)}`)
    }
  
    console.log('Review created and label added');
  }